import {redirect} from "next/navigation";
export default async function LegacyCatalogDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 redirect("/prompt/"+id);
}
