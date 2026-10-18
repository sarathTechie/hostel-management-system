import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import App from './App';
import { api } from './api';

vi.mock('./api',()=>({api:{get:vi.fn(),post:vi.fn(),patch:vi.fn()}}));
const mockedApi=vi.mocked(api);
const getMock=api.get as unknown as ReturnType<typeof vi.fn>;
const postMock=api.post as unknown as ReturnType<typeof vi.fn>;
const patchMock=api.patch as unknown as ReturnType<typeof vi.fn>;
function RouteProbe(){const loc=useLocation(),navigate=useNavigate();return <><output aria-label="Current URL">{loc.pathname}</output><button onClick={()=>navigate(-1)}>Test browser back</button><button onClick={()=>navigate(1)}>Test browser forward</button></>}
function open(
  path:string,
  role:'ADMIN'|'ACCOUNTANT'|'STUDENT'='ADMIN',
  notifications:Array<Record<string,unknown>>=[],
  students:Array<Record<string,unknown>>=[],
  leaves:Array<Record<string,unknown>>=[],
  complaints:Array<Record<string,unknown>>=[],
) {
  getMock.mockImplementation(async(url:string)=>{
    if(url==='/auth/me')return {data:{user:{id:'test-user',name:'Demo User',username:'demo',role}}} as any;
    if(url==='/dashboard')return {data:{students:0,beds:0,occupied:0,vacant:0,openComplaints:0,outstanding:0,feeDues:0,complaints:[],leave:[],occupancy:[]}} as any;
    if(url==='/my/room')return {data:null} as any;
    if(url==='/my/profile')return {data:{rollNumber:'STU001',user:{name:'Demo User'}}} as any;
    if(url==='/notifications')return {data:{notifications,unreadCount:notifications.filter(notification=>!notification.readAt).length}} as any;
    if(url==='/students')return {data:students} as any;
    if(url==='/leaves')return {data:leaves} as any;
    if(url==='/complaints')return {data:complaints} as any;
    return {data:[]} as any;
  });
  const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><App/><RouteProbe/></MemoryRouter></QueryClientProvider>);
}
afterEach(()=>{cleanup();vi.clearAllMocks()});

describe('HMS authentication and route access',()=>{
  it('shows username and password sign-in fields',()=>{
    getMock.mockImplementation(()=>new Promise(()=>{}));
    const queryClient=new QueryClient();
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/login']}><App/></MemoryRouter></QueryClientProvider>);
    expect(screen.getByRole('heading',{name:'Sign in to HMS'})).toBeTruthy();
    expect(screen.getByLabelText(/username or roll number/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it('shows the authentication error returned by the server',async()=>{
    getMock.mockRejectedValue({response:{status:401}});
    postMock.mockRejectedValue({response:{status:401,data:{error:'Invalid username or password.'}}});
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/login']}><App/></MemoryRouter></QueryClientProvider>);

    fireEvent.change(screen.getByLabelText(/username or roll number/i),{target:{value:'ADM001'}});
    fireEvent.change(screen.getByLabelText(/password/i),{target:{value:'incorrect'}});
    fireEvent.click(screen.getByRole('button',{name:/sign in/i}));

    expect((await screen.findByRole('alert')).textContent).toBe('Invalid username or password.');
    expect((screen.getByRole('button',{name:/sign in/i}) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([
    ['/','Good'],
    ['/students','Students'],['/rooms','Rooms & beds'],['/accounts','User accounts'],
    ['/fees','Fee management'],['/complaints','Complaints'],['/visitors','Visitor register'],
    ['/leaves','Leave & outpass'],['/notifications','Notifications'],['/mess','Mess menu'],['/notices','Notice board'],
    ['/reports','Reports'],['/audit','Audit history'],
  ])('opens the admin workspace page %s',async(path,title)=>{
    open(path);
    await screen.findByRole('heading',{level:1,name:new RegExp(title,'i')});
  });

  it('replaces Fee Management for every Admin sidebar destination',async()=>{
    open('/fees');
    await screen.findByRole('heading',{level:1,name:'Fee management'});
    const destinations=[['/','Good'],['/students','Students'],['/rooms','Rooms & beds'],['/accounts','User accounts'],['/fees','Fee management'],['/complaints','Complaints'],['/visitors','Visitor register'],['/leaves','Leave & outpass'],['/notifications','Notifications'],['/mess','Mess menu'],['/notices','Notice board'],['/reports','Reports'],['/audit','Audit history']];
    for(const [path,title] of destinations){
      const link=screen.getByRole('navigation',{name:'Main navigation'}).querySelector(`a[href="${path}"]`);
      expect(link).not.toBeNull();
      fireEvent.click(link!);
      await screen.findByRole('heading',{level:1,name:new RegExp(title,'i')});
      expect(screen.getByLabelText('Current URL').textContent).toBe(path);
      expect(link?.getAttribute('aria-current')).toBe('page');
    }
  });

  it('supports browser Back and Forward after sidebar navigation',async()=>{
    open('/fees');
    await screen.findByRole('heading',{level:1,name:'Fee management'});
    fireEvent.click(screen.getByRole('navigation',{name:'Main navigation'}).querySelector('a[href="/complaints"]')!);
    await screen.findByRole('heading',{level:1,name:'Complaints'});
    expect(screen.getByLabelText('Current URL').textContent).toBe('/complaints');
    fireEvent.click(screen.getByRole('button',{name:'Test browser back'}));
    await screen.findByRole('heading',{level:1,name:'Fee management'});
    expect(screen.getByLabelText('Current URL').textContent).toBe('/fees');
    fireEvent.click(screen.getByRole('button',{name:'Test browser forward'}));
    await screen.findByRole('heading',{level:1,name:'Complaints'});
    expect(screen.getByLabelText('Current URL').textContent).toBe('/complaints');
  });

  it('advances to the next page of student records without an API write',async()=>{
    const students=Array.from({length:12},(_,index)=>({
      id:`student-${index+1}`,
      user:{name:`Resident ${index+1}`,active:true},
      rollNumber:`STU${String(index+1).padStart(3,'0')}`,
      course:'BSc',
      department:'Science',
      allocations:[],
    }));
    open('/students','ADMIN',[],students);

    await screen.findByText('STU001');
    expect(screen.getByText('Page 1 of 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Next'}));

    expect(screen.getByText('Page 2 of 2')).toBeTruthy();
    expect(screen.getByText('STU012')).toBeTruthy();
    expect(screen.queryByText('STU001')).toBeNull();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('closes page-specific dialogs when navigating to another record page',async()=>{
    open('/students');
    await screen.findByRole('heading',{level:1,name:'Students'});
    fireEvent.click(screen.getByRole('button',{name:/add student/i}));
    await screen.findByRole('heading',{name:'Add student'});

    fireEvent.click(screen.getByRole('navigation',{name:'Main navigation'}).querySelector('a[href="/fees"]')!);
    await screen.findByRole('heading',{level:1,name:'Fee management'});
    expect(screen.queryByRole('heading',{name:'Add student'})).toBeNull();
  });

  it('returns to sign-in when an API request reports an expired session',async()=>{
    open('/');
    await screen.findByRole('heading',{level:1,name:/good/i});

    window.dispatchEvent(new Event('hms:unauthorized'));

    await screen.findByRole('heading',{name:'Sign in to HMS'});
  });

  it('filters the navigation for Accountant and Student roles',async()=>{
    open('/','ACCOUNTANT');
    await screen.findByRole('heading',{level:1,name:/good/i});
    const accountantNav=screen.getByRole('navigation',{name:'Main navigation'});
    expect(accountantNav.querySelector('a[href="/fees"]')).not.toBeNull();
    expect(accountantNav.querySelector('a[href="/reports"]')).not.toBeNull();
    expect(accountantNav.querySelector('a[href="/notifications"]')).not.toBeNull();
    expect(accountantNav.querySelector('a[href="/students"]')).toBeNull();
    cleanup();
    open('/','STUDENT');
    await screen.findByRole('heading',{level:1,name:/good/i});
    const studentNav=screen.getByRole('navigation',{name:'Main navigation'});
    for(const href of ['/my-room','/fees','/complaints','/leaves','/notifications','/mess','/notices'])expect(studentNav.querySelector(`a[href="${href}"]`)).not.toBeNull();
    expect(studentNav.querySelector('a[href="/reports"]')).toBeNull();
  });

  it('keeps student navigation role-specific and renders Access Denied for protected admin routes',async()=>{
    open('/students','STUDENT');
    await screen.findByRole('heading',{level:1,name:'Access denied'});
    expect(screen.queryByRole('link',{name:'Students'})).toBeNull();
  });

  it('matches a valid route when its URL includes a query string',async()=>{
    open('/complaints?status=OPEN');
    await screen.findByRole('heading',{level:1,name:'Complaints'});
  });

  it('renders direct Help, My Room and My Profile URLs in their intended pages',async()=>{
    open('/help');
    await screen.findByRole('heading',{level:1,name:'Help & FAQ'});

    cleanup();
    open('/my-room','STUDENT');
    await screen.findByRole('heading',{level:1,name:'My room'});

    cleanup();
    open('/my-profile','STUDENT');
    await screen.findByRole('heading',{level:1,name:'My profile'});
  });

  it('lets Admins view students with currently active approved leave',async()=>{
    open('/leaves');
    await screen.findByRole('heading',{level:1,name:'Leave & outpass'});

    fireEvent.click(screen.getByRole('button',{name:'Currently away now'}));

    await screen.findByRole('heading',{level:1,name:'Currently on leave'});
    expect(getMock).toHaveBeenCalledWith('/leaves/currently-away');
  });

  it('opens and submits the Admin leave review action',async()=>{
    open('/leaves','ADMIN',[],[],[{
      id:'leave-1',
      student:{user:{name:'Resident One'},rollNumber:'STU001'},
      reason:'Family visit',
      fromAt:'2026-11-01T08:00:00.000Z',
      toAt:'2026-11-02T08:00:00.000Z',
      status:'PENDING',
      remark:null,
      decidedAt:null,
      decidedBy:null,
    }]);
    patchMock.mockResolvedValue({data:{status:'APPROVED'}} as any);

    await screen.findByRole('button',{name:'Review'});
    fireEvent.click(screen.getByRole('button',{name:'Review'}));
    await screen.findByRole('heading',{name:'Review leave request · Resident One'});
    fireEvent.click(screen.getByRole('button',{name:/save changes/i}));

    await waitFor(()=>expect(patchMock).toHaveBeenCalledWith('/leaves/leave-1',{status:'APPROVED',remark:''}));
  });

  it('opens the complaint update dialog and requires remarks before resolution',async()=>{
    open('/complaints','ADMIN',[],[],[],[{
      id:'complaint-1',ticketNumber:'CMP-TEST-1',status:'OPEN',category:'Electrical',
      location:'Room 101',description:'Light is not working',createdAt:'2026-10-18T10:00:00.000Z',
      history:[],student:{user:{name:'Resident One',username:'STU001'}},
    }]);

    await screen.findByRole('button',{name:'Update'});
    fireEvent.click(screen.getByRole('button',{name:'Update'}));
    await screen.findByRole('heading',{name:'Update complaint · CMP-TEST-1'});
    fireEvent.change(screen.getByLabelText(/status/i),{target:{value:'RESOLVED'}});
    fireEvent.click(screen.getByRole('button',{name:/save changes/i}));

    expect(await screen.findByText('Add resolution notes before resolving this complaint.')).toBeTruthy();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('shows and marks in-app notifications as read',async()=>{
    open('/notifications','ADMIN',[{
      id:'notice-1',
      title:'New leave request',
      message:'A student submitted a leave request for review.',
      href:'/leaves',
      readAt:null,
      createdAt:'2026-10-18T10:00:00.000Z',
    }]);
    patchMock.mockResolvedValue({data:{id:'notice-1',readAt:'2026-10-18T10:01:00.000Z'}} as any);

    await screen.findByRole('heading',{level:1,name:'Notifications'});
    await screen.findByText('A student submitted a leave request for review.');
    fireEvent.click(screen.getByRole('button',{name:'Mark read'}));

    await waitFor(()=>expect(patchMock).toHaveBeenCalledWith('/notifications/notice-1/read'));
  });

  it('clears the session view and opens login only after server confirms logout',async()=>{
    let sessionActive=true;
    open('/');
    await screen.findByRole('heading',{level:1,name:/good/i});
    getMock.mockImplementation(async(url:string)=>{if(url==='/auth/me'){if(!sessionActive)throw {response:{status:401}};return {data:{user:{id:'test-user',name:'Demo User',username:'ADM001',role:'ADMIN'}}} as any}if(url==='/dashboard')return {data:{students:0,beds:0,occupied:0,vacant:0,openComplaints:0,outstanding:0,feeDues:0,complaints:[],leave:[],occupancy:[]}} as any;return {data:[]} as any});
    postMock.mockImplementation(async(url:string,body:any)=>{if(url==='/auth/logout'){sessionActive=false;return {data:{ok:true}} as any}if(url==='/auth/login'&&body.username==='ACC001'&&body.password==='2222'){sessionActive=true;return {data:{user:{id:'accountant-user',name:'Demo Accountant',username:'ACC001',role:'ACCOUNTANT'}}} as any}throw new Error('Unexpected auth request')});
    fireEvent.click(screen.getByRole('button',{name:/account menu/i}));
    fireEvent.click(screen.getByRole('menuitem',{name:/log out/i}));
    await screen.findByRole('heading',{name:'Sign in to HMS'});
    expect(postMock).toHaveBeenCalledWith('/auth/logout');
    fireEvent.change(screen.getByLabelText(/username or roll number/i),{target:{value:'ACC001'}});
    fireEvent.change(screen.getByLabelText(/password/i),{target:{value:'2222'}});
    fireEvent.click(screen.getByRole('button',{name:/sign in/i}));
    await screen.findByRole('heading',{level:1,name:/good/i});
    expect(screen.getByRole('navigation',{name:'Main navigation'}).querySelector('a[href="/students"]')).toBeNull();
    expect(postMock).toHaveBeenCalledWith('/auth/login',expect.objectContaining({username:'ACC001',password:'2222'}));
  });

  it('keeps the user on the page and shows safe diagnostics when logout fails',async()=>{
    open('/');
    await screen.findByRole('heading',{level:1,name:/good/i});
    postMock.mockRejectedValue({response:{status:500}});
    fireEvent.click(screen.getByRole('button',{name:/account menu/i}));
    fireEvent.click(screen.getByRole('menuitem',{name:/log out/i}));
    expect((await screen.findByRole('alert')).textContent).toMatch(/HTTP 500.*session may still be active/i);
    expect(screen.getByLabelText('Current URL').textContent).toBe('/');
  });


  it('shows a real not-found page for an unknown route',async()=>{
    open('/not-a-real-page');
    await screen.findByRole('heading',{name:/workspace page doesn’t exist/i});
  });
});
