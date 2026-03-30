import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  // createJSONStorage,
  // devtools,
  // persist,
  subscribeWithSelector,
} from "zustand/middleware";
interface User {
  name: string;
  age: number;
  hobby: {
    sing: string;
    dance: string;
    rap: string;
    basketball: string;
  };
  setHobbyRap: (rap: string) => void;
  setHobbyBasketball: (basketball: string) => void;
  setAge: () => void;
}

// const logger = (config: any) => (set: any, get: any, api: any) =>
//   config(
//     (...args: any[]) => {
//       console.log(api);
//       console.log("before", get());
//       set(...args);
//       console.log("after", get());
//     },
//     get,
//     api
//   );

const useUserStore = create<User>()(
  immer(
    subscribeWithSelector(
      // persist(
      // logger(
      //   devtools(
      (set: any) => ({
        name: "坤坤",
        age: 18,
        hobby: {
          sing: "坤式唱腔",
          dance: "坤式舞步",
          rap: "坤式rap",
          basketball: "坤式篮球",
        },
        setHobbyRap: (rap: string) =>
          set((state: any) => {
            state.hobby.rap = rap;
          }),
        setHobbyBasketball: (basketball: string) =>
          set((state: any) => {
            state.hobby.basketball = basketball;
          }),
        setAge: () =>
          set((state: any) => {
            state.age += 1;
          }),
      })
      // {
      //   name: "lk-user", // 仓库名称(唯一)
      //   storage: createJSONStorage(() => localStorage), // 存储方式 可选 localStorage sessionStorage IndexedDB 默认localStorage
      //   partialize: (state) => ({
      //     name: state.name,
      //     age: state.age,
      //     hobby: state.hobby,
      //   }), // 部分状态持久化
      // }
      // {
      //   enabled: true, // 是否开启devtools
      //   name: "user", // 仓库名称
      // }
    )
  )
  //   )
  // )
);

export default useUserStore;
