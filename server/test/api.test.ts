import {beforeEach,describe,it,expect,vi} from 'vitest';
import request from 'supertest';

vi.mock('../src/db.js',()=>({prisma:{
 session:{deleteMany:vi.fn(async()=>({count:1})),findUnique:vi.fn(async()=>null),update:vi.fn()},
 user:{findMany:vi.fn(async()=>[]),create:vi.fn()},
 student:{findUnique:vi.fn(async()=>null),findUniqueOrThrow:vi.fn(async()=>({userId:'student-user'})),create:vi.fn()},
 leaveRequest:{findMany:vi.fn(async()=>[]),create:vi.fn(),updateMany:vi.fn(),findUniqueOrThrow:vi.fn()},
 notification:{findMany:vi.fn(async()=>[]),count:vi.fn(async()=>0),updateMany:vi.fn(async()=>({count:1})),findFirst:vi.fn(),create:vi.fn(),createMany:vi.fn()},
 auditLog:{create:vi.fn()},
 $transaction:vi.fn(),
}}));
import {prisma} from '../src/db.js';
import {app} from '../src/app.js';

describe('API security boundaries',()=>{
 beforeEach(()=>{
   vi.clearAllMocks();
   vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
   vi.mocked(prisma.$transaction).mockReset();
 });
 it('responds to the public health route',async()=>{const r=await request(app).get('/api/v1/health');expect(r.status).toBe(200);expect(r.body.status).toBe('ok')});
 it('requires a session for business APIs',async()=>{const r=await request(app).get('/api/v1/students');expect(r.status).toBe(401);expect(r.body.error).toMatch(/sign in/i)});
 it('creates the student profile without account-only fields',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-admin',name:'Test Admin',username:'admin',role:'ADMIN',active:true},
   } as never);
   const tx={
     user:{create:vi.fn(async()=>({id:'new-user'}))},
     student:{create:vi.fn(async()=>({id:'new-student',rollNumber:'ROLL-1'}))},
   };
   vi.mocked(prisma.$transaction).mockImplementation((async(operation:(transaction:never)=>Promise<unknown>)=>operation(tx as never)) as never);

   const r=await request(app).post('/api/v1/students')
     .set('Cookie','hms_session=test-session-token')
     .send({
       name:'New Student',
       rollNumber:'ROLL-1',
       course:'BSc',
       department:'Testing',
       contactNumber:'+91 90000 00001',
       email:'student@example.com',
       guardianName:'QA Guardian',
       guardianContact:'+91 90000 00002',
       password:'TestStudentPass2026!',
     });

   expect(r.status).toBe(201);
   expect(tx.user.create).toHaveBeenCalledWith({data:expect.objectContaining({
     name:'New Student',
     username:'ROLL-1',
     role:'STUDENT',
     passwordHash:expect.any(String),
   })});
   expect(tx.student.create).toHaveBeenCalledWith({data:{
     rollNumber:'ROLL-1',
     course:'BSc',
     department:'Testing',
     contactNumber:'+91 90000 00001',
     email:'student@example.com',
     guardianName:'QA Guardian',
     guardianContact:'+91 90000 00002',
     userId:'new-user',
   }});
 });
 it('returns only currently active approved leave requests to Admins',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-admin',name:'Test Admin',username:'admin',role:'ADMIN',active:true},
   } as never);

   const r=await request(app).get('/api/v1/leaves/currently-away').set('Cookie','hms_session=test-session-token');

   expect(r.status).toBe(200);
   expect(prisma.leaveRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
     where:{status:'APPROVED',fromAt:{lte:expect.any(Date)},toAt:{gte:expect.any(Date)}},
   }));
 });
 it('denies students access to the Admin current-leave view',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-student',name:'Test Student',username:'student',role:'STUDENT',active:true},
   } as never);

   const r=await request(app).get('/api/v1/leaves/currently-away').set('Cookie','hms_session=test-session-token');

   expect(r.status).toBe(403);
   expect(prisma.leaveRequest.findMany).not.toHaveBeenCalled();
 });
 it('returns only the signed-in user’s notifications and unread count',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-student',name:'Test Student',username:'student',role:'STUDENT',active:true},
   } as never);
   vi.mocked(prisma.notification.findMany).mockResolvedValue([{id:'notification-1'}] as never);
   vi.mocked(prisma.notification.count).mockResolvedValue(1);

   const r=await request(app).get('/api/v1/notifications').set('Cookie','hms_session=test-session-token');

   expect(r.status).toBe(200);
   expect(r.body.unreadCount).toBe(1);
   expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{userId:'test-student'}}));
   expect(prisma.notification.count).toHaveBeenCalledWith({where:{userId:'test-student',readAt:null}});
 });
 it('marks only the signed-in user’s notification as read',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-student',name:'Test Student',username:'student',role:'STUDENT',active:true},
   } as never);
   vi.mocked(prisma.notification.findFirst).mockResolvedValue({id:'notification-1',userId:'test-student',readAt:new Date()} as never);

   const r=await request(app).patch('/api/v1/notifications/notification-1/read').set('Cookie','hms_session=test-session-token');

   expect(r.status).toBe(200);
   expect(prisma.notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
     where:{id:'notification-1',userId:'test-student',readAt:null},
   }));
   expect(prisma.notification.findFirst).toHaveBeenCalledWith({where:{id:'notification-1',userId:'test-student'}});
 });
 it('creates Admin notifications in the same transaction as a leave request',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-student-user',name:'Test Student',username:'student',role:'STUDENT',active:true},
   } as never);
   vi.mocked(prisma.student.findUnique).mockResolvedValue({id:'student-profile'} as never);
   const tx={
     user:{findMany:vi.fn(async()=>[{id:'test-admin'}])},
     leaveRequest:{create:vi.fn(async()=>({id:'leave-1',student:{user:{name:'Test Student'}}}))},
     notification:{createMany:vi.fn(async()=>({count:1}))},
   };
   vi.mocked(prisma.$transaction).mockImplementation((async(operation:(transaction:never)=>Promise<unknown>)=>operation(tx as never)) as never);

   const r=await request(app).post('/api/v1/leaves')
     .set('Cookie','hms_session=test-session-token')
     .send({reason:'Family visit',fromAt:'2026-11-01T08:00:00.000Z',toAt:'2026-11-02T08:00:00.000Z'});

   expect(r.status).toBe(201);
   expect(tx.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:'test-admin',href:'/leaves'})]});
 });
 it('notifies the student when Admin decides a pending leave request',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-admin',name:'Test Admin',username:'admin',role:'ADMIN',active:true},
   } as never);
   const tx={
     leaveRequest:{
       updateMany:vi.fn(async()=>({count:1})),
       findUniqueOrThrow:vi.fn(async()=>({id:'leave-1',studentId:'student-profile'})),
     },
     student:{findUniqueOrThrow:vi.fn(async()=>({userId:'test-student-user'}))},
     notification:{create:vi.fn(async()=>({id:'notification-1'}))},
     auditLog:{create:vi.fn(async()=>({id:'audit-1'}))},
   };
   vi.mocked(prisma.$transaction).mockImplementation((async(operation:(transaction:never)=>Promise<unknown>)=>operation(tx as never)) as never);

   const r=await request(app).patch('/api/v1/leaves/leave-1')
     .set('Cookie','hms_session=test-session-token')
     .send({status:'REJECTED',remark:'Please provide more details.'});

   expect(r.status).toBe(200);
   expect(tx.notification.create).toHaveBeenCalledWith({data:expect.objectContaining({
     userId:'test-student-user',
     title:'Leave request rejected',
     href:'/leaves',
   })});
 });
 it('invalidates the cookie session and clears its cookie even when auth middleware would reject it',async()=>{
   const cookie='hms_session=one-time-invalid-session-token';
   const r=await request(app).post('/api/v1/auth/logout').set('Cookie',cookie).set('Origin','http://localhost:4173');
   expect(r.status).toBe(200);expect(r.body.ok).toBe(true);
   expect(prisma.session.deleteMany).toHaveBeenCalledWith({where:{tokenHash:expect.stringMatching(/^[a-f0-9]{64}$/)}});
   expect(r.headers['set-cookie']?.[0]).toMatch(/hms_session=;.*HttpOnly.*SameSite=Lax/i);
   const reuse=await request(app).get('/api/v1/auth/me').set('Cookie',cookie);
   expect(reuse.status).toBe(401);
 });
 it('rejects cross-origin logout without touching the session',async()=>{
   const r=await request(app).post('/api/v1/auth/logout').set('Cookie','hms_session=some-token').set('Origin','https://attacker.invalid');
   expect(r.status).toBe(403);expect(prisma.session.deleteMany).not.toHaveBeenCalled();
 });
 it('rejects an unlisted origin on API preflight',async()=>{
   const r=await request(app).options('/api/v1/auth/logout').set('Origin','http://localhost:4174').set('Access-Control-Request-Method','POST');
   expect(r.status).toBe(403);expect(r.body.error).toBe('Request origin is not allowed.');
 });
 it('returns a retryable conflict when allocation detects a concurrent database update',async()=>{
   vi.mocked(prisma.session.findUnique).mockResolvedValue({
     id:'test-session',
     expiresAt:new Date(Date.now()+60_000),
     lastActivity:new Date(),
     user:{id:'test-admin',name:'Test Admin',username:'admin',role:'ADMIN',active:true},
   } as never);
   vi.mocked(prisma.$transaction).mockRejectedValue({code:'P2034'} as never);

   const r=await request(app).post('/api/v1/allocations')
     .set('Cookie','hms_session=test-session-token')
     .set('Origin','http://localhost:4173')
     .send({studentId:'student-id',bedId:'bed-id'});

   expect(r.status).toBe(409);
   expect(r.body.error).toMatch(/changed during the operation/i);
 });
 it.each(['http://localhost:4173','http://localhost:5173','http://127.0.0.1:4173','http://127.0.0.1:5173'])('allows local frontend origin %s for credentialed API preflight',async(origin)=>{
   const r=await request(app).options('/api/v1/auth/logout').set('Origin',origin).set('Access-Control-Request-Method','POST').set('Access-Control-Request-Headers','content-type');
   expect(r.status).toBe(204);expect(r.headers['access-control-allow-origin']).toBe(origin);expect(r.headers['access-control-allow-credentials']).toBe('true');
 });
 it('accepts an allowed local origin before validating login fields',async()=>{
   const r=await request(app).post('/api/v1/auth/login').set('Origin','http://127.0.0.1:4173').send({username:'',password:''});
   expect(r.status).toBe(400);expect(r.headers['access-control-allow-origin']).toBe('http://127.0.0.1:4173');
 });
 it('rejects an unlisted local port before attempting login',async()=>{
   const r=await request(app).post('/api/v1/auth/login').set('Origin','http://localhost:4174').send({username:'',password:''});
   expect(r.status).toBe(403);expect(r.body.error).toBe('Request origin is not allowed.');
 });
});
