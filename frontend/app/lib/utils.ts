import {clsx, type ClassValue } from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]){
  return twMerge(clsx(inputs));
}

//Get Initial from Name or Email
export const getInitials = (name:string, email:string) =>{
  if(name){
    const parts = name.split(" ");
    if(parts.length >= 2) return `${parts[0][0]} ${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase;
  }
  return email.slice(0,2).toUpperCase;
}

// Dynamic Salutation
export const getSalutaions = () =>{
  const hours = new Date().getHours();
  if(hours < 12) return "Good Morning";
  if(hours < 18) return "Good Afternoon";
  return "Good Evening"
};


// Get Formatted Date
export const getCurrentDate = ()=>{
  return new Date().toLocaleDateString("en-US",{
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};