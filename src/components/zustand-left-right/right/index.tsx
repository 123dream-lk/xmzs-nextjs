import { memo, useEffect, useState } from "react";
import useUserStore from "@/store/user";
import { useShallow } from "zustand/react/shallow";
import { shallow } from "zustand/shallow";
export default memo(function Right() {
  const { rap, name } = useUserStore(
    useShallow((state) => ({
      rap: state.hobby.rap,
      name: state.name,
    }))
  );
  const [status, setStatus] = useState("单身");
  useEffect(() => {
    const unSubscribe = useUserStore.subscribe(
      (state) => state.age,
      (age, prevAge) => {
        console.log(age, prevAge);
        if (age >= 26) {
          setStatus("结婚");
        } else {
          setStatus("单身");
        }
      },
      {
        equalityFn: shallow,
        fireImmediately: true, // 默认是false，如果需要立即触发，可以传入true
      }
    );
    return () => {
      unSubscribe();
    };
  }, []);
  const clear = () => {
    // useUserStore.persist.clearStorage();
  };
  console.log("Right组件重新渲染");
  return (
    <div className="w-[50%] flex flex-col gap-6 border border-solid border-blue-300 p-4 rounded-md">
      <h1 className="text-xl font-bold">B组件</h1>
      <div className="flex gap-3">
        <div>
          <div>
            姓名：<span>{name}</span>
          </div>
          <div>
            rap：<span>{rap}</span>
          </div>
          <div>
            状态：<span>{status}</span>
          </div>
        </div>
      </div>
      <button
        onClick={clear}
        className="text-sm bg-blue-500 text-white px-2 py-1 rounded-md cursor-pointer w-[80px]"
      >
        清空缓存
      </button>
    </div>
  );
});
