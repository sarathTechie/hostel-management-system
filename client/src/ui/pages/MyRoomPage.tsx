import { useQuery } from '@tanstack/react-query';
import { BedDouble } from 'lucide-react';
import { api } from '../api';
import { Empty, ErrorBox, Loading, PageHead } from '../common';

export default function MyRoomPage(){const {data,isLoading,error}=useQuery({queryKey:['/my/room'],queryFn:()=>api.get('/my/room').then(r=>r.data)});if(isLoading)return <Loading/>;if(error)return <ErrorBox/>;return <><PageHead eyebrow="YOUR ACCOMMODATION" title="My room" desc="Your current hostel room and bed assignment."/>{data?<section className="panel my-room-card"><div className="my-room-icon"><BedDouble size={24}/></div><h2>{data.bed?.room?.block?.name} · Room {data.bed?.room?.roomNumber}</h2><div className="my-room-details"><div><small>Floor</small><b>{data.bed?.room?.floor?.name??'—'}</b></div><div><small>Bed</small><b>{data.bed?.bedNumber}</b></div><div><small>Allocated</small><b>{new Date(data.allocatedAt).toLocaleDateString('en-IN')}</b></div></div></section>:<section className="panel"><Empty title="No active room assignment" text="Contact your hostel warden if you need a room allocation."/></section>}</>}
