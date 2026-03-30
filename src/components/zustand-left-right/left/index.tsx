import { memo } from "react";
import useUserStore from "@/store/user";
import { useShallow } from "zustand/react/shallow";

export default memo(function Left() {
  const { name, age, hobby, setHobbyRap, setHobbyBasketball, setAge } = useUserStore(
    useShallow((state) => ({
      name: state.name,
      age: state.age,
      hobby: state.hobby,
      setHobbyRap: state.setHobbyRap,
      setHobbyBasketball: state.setHobbyBasketball,
      setAge: state.setAge,
    }))
  );
  console.log("Left组件重新渲染");
  return (
    <div className="w-[50%] flex flex-col gap-6 border border-solid border-blue-300 p-4 rounded-md">
      <h1 className="text-xl font-bold">A组件</h1>
      <h3>{name}</h3>
      <div>
        <div>
          年龄：<span>{age}</span>
        </div>
        <div>
          爱好1：<span>{hobby.sing}</span>
        </div>
        <div>
          爱好2：<span>{hobby.dance}</span>
        </div>
        <div>
          爱好3：<span>{hobby.rap}</span>
        </div>
        <div>
          爱好4：<span>{hobby.basketball}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setHobbyRap("只因你太美")}
          className="text-sm bg-blue-500 text-white px-2 py-1 rounded-md cursor-pointer"
        >
          改变爱好rap
        </button>
        <button
          onClick={() => setHobbyBasketball("篮球")}
          className="text-sm bg-red-500 text-white px-2 py-1 rounded-md cursor-pointer"
        >
          改变爱好basketball
        </button>
        <button
          onClick={() => setAge()}
          className="text-sm bg-green-500 text-white px-2 py-1 rounded-md cursor-pointer"
        >
          改变年龄
        </button>
      </div>
    </div>
  );
});
