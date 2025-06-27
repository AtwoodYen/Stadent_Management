// 為自定義模組添加型別宣告
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// 為自定義頁面元件添加型別
declare module './pages/DashboardPage' {
  const DashboardPage: React.FC;
  export default DashboardPage;
}

declare module './pages/SchedulePage' {
  const SchedulePage: React.FC;
  export default SchedulePage;
}

declare module './layouts/Layout' {
  const Layout: React.FC<{ children: React.ReactNode }>;
  export default Layout;
}
