import {NextRequest,NextResponse} from "next/server";
export function middleware(request:NextRequest){
 const id=request.nextUrl.pathname.split("/")[2];
 if(id)return NextResponse.redirect(new URL("/prompt/"+id,request.url),308);
 return NextResponse.next();
}
export const config={matcher:["/catalog/:path*"]};
