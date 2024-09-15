"use client";
import { Editor, rootCtx } from '@milkdown/kit/core';
import { nord } from '@milkdown/theme-nord';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from "@milkdown/kit/plugin/history";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { cursor } from "@milkdown/kit/plugin/cursor";
import { listener } from "@milkdown/kit/plugin/listener";
import { indent } from "@milkdown/kit/plugin/indent";
import { upload } from "@milkdown/kit/plugin/upload";
import { block } from "@milkdown/kit/plugin/block";
import { math } from "@milkdown/plugin-math";
import { prism,prismConfig } from "@milkdown/plugin-prism";
import 'prism-themes/themes/prism-nord.css';
import 'katex/dist/katex.min.css';
import "@aria-packs/plugin-menu/style.css"
import "@/styles/milkdown.scss";
import { useEffect } from 'react';
import { Ctx } from '@milkdown/ctx';
import { CmdKey } from '@milkdown/core';

type CommandPayload = unknown;
type ButtonConfig<T = unknown> = {
    type: 'button';
    content: string | HTMLElement;
    key: string | [string, CommandPayload] | [CmdKey<T>, T];
    active?: (ctx: Ctx) => boolean;
    disabled?: (ctx: Ctx) => boolean;
};
type SelectOptions = {
    id: string | number;
    content: string | HTMLElement;
};
type SelectConfig = {
    type: 'select';
    options: SelectOptions[];
    text: string;
    onSelect: (id: SelectOptions['id']) => [string, CommandPayload] | string;
    disabled?: (ctx: Ctx) => boolean;
};
type MenuConfigItem = SelectConfig | ButtonConfig;

const menuItems:MenuConfigItem[][]=[
  [
    {
      type: 'select',
      text: '标题',
      options: [
        { id: 1, content: 'H1' },
        { id: 2, content: 'H2' },
        { id: 3, content: 'H3' },
        { id: 4, content: 'H4' },
        { id: 0, content: '标准文本' },
      ],
      onSelect: (id) => (!!id ? ['WrapInHeading', id] : 'TurnIntoText'),
    },
  ],
  [
    {
      type: 'button',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16"><path fill="currentColor" d="M4 3.1C4 2.5 4.5 2 5.1 2h3c2.1 0 3.4 1.4 3.4 3.4c0 .9-.3 2-.7 2.6c.8.6 1.4 1.2 1.4 2.5c0 2.7-2.1 3.5-3.6 3.5H5.1c-.6 0-1.1-.5-1.1-1.1zM6 9v3h2.4c.7 0 1.5-.5 1.5-1.5S9.1 9 8.4 9zm0-2h2.2c.9 0 1.5-.7 1.5-1.5S9.1 4 8.3 4H6z"></path></svg>`,
      key: 'ToggleStrong',
    },
    {
      type: 'button',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16"><path fill="currentColor" d="M13 2H7a.5.5 0 0 0 0 1h2.474L5.656 13H3a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H6.726l3.818-10H13a.5.5 0 0 0 0-1"></path></svg>`,
      key: 'ToggleEmphasis',
    },
    {
      type: 'button',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16"><path fill="currentColor" d="M5 5.1c0-.554.292-1.065.84-1.455C6.392 3.252 7.187 3 8.1 3c1.298 0 2.384.56 2.763 1.243a.5.5 0 0 0 .874-.486C11.117 2.64 9.602 2 8.1 2c-1.087 0-2.092.298-2.84.83C4.508 3.365 4 4.154 4 5.1c0 .72.3 1.375.79 1.9h1.722C5.552 6.593 5 5.83 5 5.1M13.5 8a.5.5 0 0 1 0 1h-2.342c.517.504.842 1.149.842 1.9c0 .902-.515 1.688-1.255 2.229c-.743.543-1.749.871-2.845.871c-1.624 0-3.002-.65-3.716-1.723a.5.5 0 0 1 .832-.554C5.502 12.45 6.524 13 7.9 13c.904 0 1.698-.272 2.255-.679c.56-.409.845-.923.845-1.421c0-.775-.63-1.526-1.777-1.9H2.5a.5.5 0 0 1 0-1z"></path></svg>`,
      key: 'ToggleStrikeThrough',
    },
    {
      type: 'button',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16"><path fill="currentColor" d="M9.803 3.043a.5.5 0 0 1 .254.66l-4 9a.5.5 0 0 1-.914-.406l4-9a.5.5 0 0 1 .66-.254m-5.47 2.333a.5.5 0 0 1 .04.706L2.67 8l1.705 1.918a.5.5 0 1 1-.748.664l-2-2.25a.5.5 0 0 1 0-.664l2-2.25a.5.5 0 0 1 .706-.042m7.335 0a.5.5 0 0 1 .706.042l2 2.25a.5.5 0 0 1 0 .664l-2 2.25a.5.5 0 1 1-.748-.664L13.331 8l-1.705-1.918a.5.5 0 0 1 .042-.706"></path></svg>`,
      key: 'CreateCodeBlock',
    },
  ],
]
const languages=[
  "markdown","css","javascript","typescript","jsx","tsx","tsx","json","css","python","cpp","java","c","sass","scss","stylus","bash","powershell","rust","php","sql","go","pug","yaml","latex","batch"
];
const MilkdownEditor:React.FC=()=>{
  const { get }=useEditor((root)=>
    Editor.make()
      .config(nord)
      .config((ctx)=>{
        ctx.set(rootCtx, root);
      })
      .config((ctx)=>{
        ctx.set(prismConfig.key, {
          configureRefractor:(refractor)=>{
            languages.forEach((language)=>{
              (async (language)=>{
                refractor.register((await import(`refractor/lang/${language}`)).default);
              })(language)
            })
          }
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(cursor)
      .use(listener)
      .use(indent)
      .use(upload)
      .use(block)
      .use(math)
      .use(prism)
  );
  useEffect(()=>{
    import("@aria-packs/plugin-menu").then(({menu, menuConfigCtx})=>
      get()!
        .config((ctx)=>{
          ctx.set(menuConfigCtx.key, {
            attributes: { class: 'milkdown-menu', 'data-menu': 'true' },
            items: menuItems,
          })
        })
        .use(menu)
    )
  },[]);
  return <Milkdown />;
};

export default MilkdownEditor;