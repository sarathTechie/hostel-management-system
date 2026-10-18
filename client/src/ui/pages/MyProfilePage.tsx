import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { api } from '../api';
import { ErrorBox, Loading, PageHead } from '../common';

export default function MyProfilePage(){const {data,isLoading,error}=useQuery({queryKey:['/my/profile'],queryFn:()=>api.get('/my/profile').then(r=>r.data)});if(isLoading)return <Loading/>;if(error)return <ErrorBox/>;return <><PageHead eyebrow="YOUR ACCOUNT" title="My profile" desc="Review the student and guardian details on your account."/>{data&&<section className="panel my-room-card"><div className="my-room-icon"><Users size={24}/></div><h2>{data.user?.name}</h2><div className="my-room-details profile-details">{[['Roll number',data.rollNumber],['Course',data.course],['Department',data.department],['Contact',data.contactNumber],['Email',data.email],['Guardian',data.guardianName],['Guardian contact',data.guardianContact]].map(([key,value])=><div key={key}><small>{key}</small><b>{value||'—'}</b></div>)}</div></section>}</>}
