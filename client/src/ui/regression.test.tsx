import { Profiler } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { api } from './api';

vi.mock('./api',()=>({api:{get:vi.fn(),post:vi.fn(),patch:vi.fn(),delete:vi.fn()}}));
const getMock=api.get as unknown as ReturnType<typeof vi.fn>;
const postMock=api.post as unknown as ReturnType<typeof vi.fn>;
afterEach(()=>{cleanup();vi.clearAllMocks()});

const user=(role:string)=>({data:{user:{id:'u1',name:'Demo',username:'demo',role}}}) as any;
const row={id:'x1',name:'N',user:{name:'N'},rollNumber:'S1',title:'T',description:'D',student:{user:{name:'S'}},status:'PENDING',entries:[],history:[],payments:[],balance:0};

describe('regression: actions must not freeze the UI',()=>{
  for(const path of ['/leaves','/fees','/complaints','/accounts','/visitors','/students']) it(`data table page ${path} does not re-render endlessly`,async()=>{
    getMock.mockImplementation(async(url:string)=>url==='/auth/me'?user('ADMIN'):url==='/rooms'?{data:[]} as any:{data:[row]} as any);
    let commits=0;
    render(<Profiler id="p" onRender={()=>{commits++}}><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={[path]}><App/></MemoryRouter></QueryClientProvider></Profiler>);
    await screen.findByText(/records$/i);
    await new Promise(r=>setTimeout(r,300));
    const before=commits;
    await new Promise(r=>setTimeout(r,700));
    expect(commits-before).toBeLessThan(5);
  },15000);

  it('opens the leave review dialog and submits the decision',async()=>{
    getMock.mockImplementation(async(url:string)=>url==='/auth/me'?user('ADMIN'):{data:[{...row,reason:'Home visit',fromAt:'2026-10-20T10:00:00Z',toAt:'2026-10-21T10:00:00Z'}]} as any);
    (api.patch as any).mockResolvedValue({data:{}});
    render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/leaves']}><App/></MemoryRouter></QueryClientProvider>);
    fireEvent.click(await screen.findByText('Review'));
    fireEvent.click(await screen.findByRole('button',{name:/save changes/i}));
    await waitFor(()=>expect(api.patch).toHaveBeenCalledWith('/leaves/x1',expect.objectContaining({status:'APPROVED'})));
  });

  it('vacating a bed actually calls the vacate endpoint',async()=>{
    const rooms=[{id:'b1',name:'Block A',floors:[],rooms:[{id:'r1',roomNumber:'101',beds:[{id:'bd1',bedNumber:'1',status:'OCCUPIED',allocations:[{id:'al1',student:{user:{name:'Stu'}}}]}]}]}];
    getMock.mockImplementation(async(url:string)=>url==='/auth/me'?user('ADMIN'):url==='/rooms'?{data:rooms} as any:{data:[]} as any);
    postMock.mockResolvedValue({data:{}});
    render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/rooms']}><App/></MemoryRouter></QueryClientProvider>);
    fireEvent.click(await screen.findByLabelText(/Room 101 bed 1/));
    fireEvent.change(await screen.findByRole('combobox',{name:/action/i}),{target:{value:'vacate'}});
    fireEvent.click(screen.getByRole('button',{name:/^save/i}));
    await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/allocations/al1/vacate'));
  });
});
