"use client";
import Left from "@/components/zustand-left-right/left";
import Right from "@/components/zustand-left-right/right";

export default function ZustandDemo() {
  return (
    <>
      <div className="min-w-[600px] container mx-auto flex flex-col gap-10 border border-solid border-gray-300 p-4 rounded-md">
        <h1 className="text-2xl font-bold text-center">Zustand Demo</h1>
        <div className="flex justify-center gap-4">
          <Left />
          <Right />
        </div>
      </div>
    </>
  );
}
