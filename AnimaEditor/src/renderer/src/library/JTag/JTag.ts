import { JTag_CustomTag } from "./tag/CustomTag";


export class JTag {
  public static svg: Record<string, string> = {
    select: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"></path></svg>`,
    translate: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v6 M12 3l-3 3 M12 3l3 3 M12 21v-6 M12 21l-3-3 M12 21l3-3 M3 12h6 M3 12l3-3 M3 12l3 3 M21 12h-6 M21 12l-3-3 M21 12l-3 3"/></svg>`,
    rotation: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M263.09 50c-11.882-.007-23.875 1.018-35.857 3.13C142.026 68.156 75.156 135.026 60.13 220.233 45.108 305.44 85.075 391.15 160.005 434.41c32.782 18.927 69.254 27.996 105.463 27.553 46.555-.57 92.675-16.865 129.957-48.15l-30.855-36.768c-50.95 42.75-122.968 49.05-180.566 15.797-57.597-33.254-88.152-98.777-76.603-164.274 11.55-65.497 62.672-116.62 128.17-128.168 51.656-9.108 103.323 7.98 139.17 43.862L327 192h128V64l-46.34 46.342C370.242 71.962 317.83 50.03 263.09 50z"></path></svg>`,
    scale: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 3h5v5"></path><path d="M17 21h2a2 2 0 0 0 2-2"></path><path d="M21 12v3"></path><path d="m21 3-5 5"></path><path d="M3 7V5a2 2 0 0 1 2-2"></path><path d="M9 3h3"></path><rect x="3" y="11" width="10" height="10" rx="1"></rect></svg>`,
    addPoint: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C12.3748 2 12.7456 2.02023 13.1104 2.06055L12.8896 4.04883C12.5979 4.01659 12.3011 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 11.6989 19.9834 11.4021 19.9512 11.1104L21.9395 10.8896C21.9798 11.2544 22 11.6252 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM20 4H23V6H20V9H18V6H15V4H18V1H20V4Z"></path></svg>`,
    removePoint: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C12.3748 2 12.7456 2.02023 13.1104 2.06055L12.8896 4.04883C12.5979 4.01659 12.3011 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 11.6989 19.9834 11.4021 19.9512 11.1104L21.9395 10.8896C21.9798 11.2544 22 11.6252 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM15 4H23V6H15V4Z"></path></svg>`,
    addEdge: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="19" r="2.5"></circle><circle cx="13" cy="11" r="2.5"></circle><path d="M6.77 17.23L11.23 12.77" fill="none" stroke="currentColor" stroke-width="2"></path><path d="M20 4H23V6H20V9H18V6H15V4H18V1H20V4Z"></path></svg>`,
    removeEdge: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="19" r="2.5"></circle><circle cx="13" cy="11" r="2.5"></circle><path d="M6.77 17.23L11.23 12.77" fill="none" stroke="currentColor" stroke-width="2"></path><path d="M15 4H23V6H15V4Z"></path></svg>`,
    rightTriangle: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm113.9 231L234.4 103.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L285.1 256 183.5 357.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L369.9 273c9.4-9.4 9.4-24.6 0-34z"></path></svg>`,
    // bone: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"></path></svg>`,
    addBone: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"></path><path fill="currentColor" stroke="none" d="M20 18H23V20H20V23H18V20H15V18H18V15H20V18Z"></path></svg>`,
    removeBone: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"></path><path fill="currentColor" stroke="none" d="M15 18H23V20H15V18Z"></path></svg>`,
    play: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>`,
    stop: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"></path></svg>`,
    weightPaint: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="5" x2="11" y2="13"></line><circle cx="9" cy="15" r="2.3" fill="currentColor" stroke="none"></circle><circle cx="13.5" cy="19" r="1.8" fill="currentColor" stroke="none"></circle><circle cx="17.5" cy="20.3" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="20.5" cy="21" r="0.7" fill="currentColor" stroke="none"></circle></svg>`,
    plus: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H13V11H20V13H13V20H11V13H4V11H11V4Z"></path></svg>`,
    minus: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 11H20V13H4V11Z"></path></svg>`,
    setting: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M262.29 192.31a64 64 0 1 0 57.4 57.4 64.13 64.13 0 0 0-57.4-57.4M416.39 256a154 154 0 0 1-1.53 20.79l45.21 35.46a10.81 10.81 0 0 1 2.45 13.75l-42.77 74a10.81 10.81 0 0 1-13.14 4.59l-44.9-18.08a16.11 16.11 0 0 0-15.17 1.75A164.5 164.5 0 0 1 325 400.8a15.94 15.94 0 0 0-8.82 12.14l-6.73 47.89a11.08 11.08 0 0 1-10.68 9.17h-85.54a11.11 11.11 0 0 1-10.69-8.87l-6.72-47.82a16.07 16.07 0 0 0-9-12.22 155 155 0 0 1-21.46-12.57 16 16 0 0 0-15.11-1.71l-44.89 18.07a10.81 10.81 0 0 1-13.14-4.58l-42.77-74a10.8 10.8 0 0 1 2.45-13.75l38.21-30a16.05 16.05 0 0 0 6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 0 0-6.07-13.94l-38.19-30A10.81 10.81 0 0 1 49.48 186l42.77-74a10.81 10.81 0 0 1 13.14-4.59l44.9 18.08a16.11 16.11 0 0 0 15.17-1.75A164.5 164.5 0 0 1 187 111.2a15.94 15.94 0 0 0 8.82-12.14l6.73-47.89A11.08 11.08 0 0 1 213.23 42h85.54a11.11 11.11 0 0 1 10.69 8.87l6.72 47.82a16.07 16.07 0 0 0 9 12.22 155 155 0 0 1 21.46 12.57 16 16 0 0 0 15.11 1.71l44.89-18.07a10.81 10.81 0 0 1 13.14 4.58l42.77 74a10.8 10.8 0 0 1-2.45 13.75l-38.21 30a16.05 16.05 0 0 0-6.05 14.08c.33 4.14.55 8.3.55 12.47"></path></svg>`,
    inf: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path></svg>`,
    hierarchy: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 1C6.61929 1 5.5 2.11929 5.5 3.5C5.5 4.7093 6.35863 5.71806 7.4995 5.94989V6.99994H5.36684C4.61209 6.99994 4.00024 7.61178 4.00024 8.36653V10.05C2.859 10.2815 2 11.2904 2 12.5C2 13.8807 3.11929 15 4.5 15C5.88071 15 7 13.8807 7 12.5C7 11.2906 6.14124 10.2818 5.00024 10.0501V8.36653C5.00024 8.16407 5.16437 7.99994 5.36684 7.99994H10.6337C10.8361 7.99994 11.0002 8.16407 11.0002 8.36653V10.05C9.859 10.2815 9 11.2904 9 12.5C9 13.8807 10.1193 15 11.5 15C12.8807 15 14 13.8807 14 12.5C14 11.2906 13.1412 10.2818 12.0002 10.0501V8.36653C12.0002 7.61178 11.3884 6.99994 10.6337 6.99994H8.4995V5.95009C9.64087 5.71865 10.5 4.70966 10.5 3.5C10.5 2.11929 9.38071 1 8 1ZM6.5 3.5C6.5 2.67157 7.17157 2 8 2C8.82843 2 9.5 2.67157 9.5 3.5C9.5 4.32843 8.82843 5 8 5C7.17157 5 6.5 4.32843 6.5 3.5ZM3 12.5C3 11.6716 3.67157 11 4.5 11C5.32843 11 6 11.6716 6 12.5C6 13.3284 5.32843 14 4.5 14C3.67157 14 3 13.3284 3 12.5ZM11.5 11C12.3284 11 13 11.6716 13 12.5C13 13.3284 12.3284 14 11.5 14C10.6716 14 10 13.3284 10 12.5C10 11.6716 10.6716 11 11.5 11Z"></path></svg>`,
    eye: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"></path></svg>`,
    folder: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M384 480l48 0c11.4 0 21.9-6 27.6-15.9l112-192c5.8-9.9 5.8-22.1 .1-32.1S555.5 224 544 224l-400 0c-11.4 0-21.9 6-27.6 15.9L48 357.1 48 96c0-8.8 7.2-16 16-16l117.5 0c4.2 0 8.3 1.7 11.3 4.7l26.5 26.5c21 21 49.5 32.8 79.2 32.8L416 144c8.8 0 16 7.2 16 16l0 32 48 0 0-32c0-35.3-28.7-64-64-64L298.5 96c-17 0-33.3-6.7-45.3-18.7L226.7 50.7c-12-12-28.3-18.7-45.3-18.7L64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l23.7 0L384 480z"></path></svg>`,
    kebab: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 5C7.44772 5 7 4.55228 7 4C7 3.44772 7.44772 3 8 3C8.55228 3 9 3.44772 9 4C9 4.55228 8.55228 5 8 5ZM8 9C7.44771 9 7 8.55229 7 8C7 7.44772 7.44771 7 8 7C8.55228 7 9 7.44772 9 8C9 8.55229 8.55228 9 8 9ZM7 12C7 12.5523 7.44771 13 8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44771 11 7 11.4477 7 12Z"></path></svg>`,
  };

  public body: HTMLElement;
  constructor() {
    this.body = document.body;
  }

  // タグの子要素を空にします
  public clear(tag: JTag_CustomTag, containerIndex: number = 0): void {
    for (const child of tag.childrenPerContainer[containerIndex]) {
      child.parent = null;
    }
    tag.childrenPerContainer[containerIndex].length = 0;
    tag.childrenContainer[containerIndex].replaceChildren();
  }

  public append(parent: JTag_CustomTag | null, tag: JTag_CustomTag, containerIndex: number = 0): void {
    tag.parent = parent;
    if (parent?.childrenContainer.length) {
      parent.childrenPerContainer[containerIndex].push(tag);
      parent.childrenContainer[containerIndex].appendChild(tag.body);
    } else {
      this.body.appendChild(tag.body);
    }
  }

  public insert(parent: JTag_CustomTag | null, tag: JTag_CustomTag, index: number, containerIndex: number = 0): void {
    tag.parent = parent;
    if (parent?.childrenContainer.length) {
      const insertIndex = index;
      parent.childrenPerContainer[containerIndex].splice(insertIndex, 0, tag);
      parent.childrenContainer[containerIndex].appendChild(tag.body);
    }
  }

  public remove(tag: JTag_CustomTag): void {
    const parent = tag.parent;
    if (parent) {
      let containerIndex = 0;
      for (containerIndex = 0; containerIndex < parent.childrenPerContainer.length; containerIndex ++) {
        const container = parent.childrenPerContainer[containerIndex];
        if (container.includes(tag)) break ;
      }
      const removeIndex = parent.childrenPerContainer[containerIndex].indexOf(tag);
      if (removeIndex) {
        parent.childrenPerContainer[containerIndex].splice(removeIndex, 1);
      } else {
        console.warn("親要素の子要素として登録されていません", parent, tag);
      }
    } else {
      console.warn("親要素がありません", tag);
    }
  }

  public static createTag<T extends JTag_CustomTag>(TagClass: new (...args: any[]) => T): T {
    return new TagClass();
  }

  public static getSvg(svg: string): string {
    return this.svg[svg];
  }
}
