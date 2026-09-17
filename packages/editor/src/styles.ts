/** Editor chrome styles. Scoped under .bwe so they never leak into the admin. */
export const EDITOR_CSS = `
.bwe{--bwe-bg:#eceef2;--bwe-panel:#fff;--bwe-line:#e2e5ea;--bwe-line-2:#d3d7de;--bwe-text:#1d2129;--bwe-muted:#687080;
--bwe-accent:#4263eb;--bwe-accent-soft:#edf2ff;--bwe-danger:#e03131;--bwe-ok:#0c8a5f;--bwe-publish:#0c8a5f;--bwe-publish-hover:#0a7350;--bwe-radius:6px;
position:fixed;inset:0;z-index:10000;display:grid;grid-template-columns:320px 1fr;grid-template-rows:48px 1fr;
background:var(--bwe-bg);color:var(--bwe-text);font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.bwe *{box-sizing:border-box}
.bwe button,.bwe input,.bwe select,.bwe textarea{font:inherit;color:inherit}
.bwe button{cursor:pointer}
.bwe :focus-visible{outline:2px solid var(--bwe-accent);outline-offset:1px}
.bwe-top{grid-column:1/3;display:flex;align-items:center;gap:6px;padding:0 10px;background:var(--bwe-panel);border-bottom:1px solid var(--bwe-line)}
.bwe-brand{display:flex;align-items:center;gap:8px;font-weight:600;min-width:0;padding-right:8px;margin-right:4px;border-right:1px solid var(--bwe-line);height:28px}
.bwe-brand a{color:inherit;text-decoration:none;display:flex;align-items:center}
.bwe-title{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bwe-spacer{flex:1}
.bwe-ibtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:32px;padding:0 8px;border:1px solid transparent;border-radius:var(--bwe-radius);background:none;color:var(--bwe-muted)}
.bwe-ibtn:hover{background:#f2f4f7;color:var(--bwe-text)}
.bwe-ibtn[aria-pressed=true]{background:var(--bwe-accent-soft);color:var(--bwe-accent)}
.bwe-ibtn:disabled{opacity:.35;cursor:default;background:none}
.bwe-devices{display:flex;gap:2px;padding:2px;border:1px solid var(--bwe-line);border-radius:8px}
.bwe-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:var(--bwe-radius);border:1px solid var(--bwe-line-2);background:#fff;font-weight:500;white-space:nowrap}
.bwe-btn:hover{border-color:#b8bec9}
.bwe-btn-primary{background:var(--bwe-accent);border-color:var(--bwe-accent);color:#fff}
.bwe-btn-primary:hover{background:#364fc7;border-color:#364fc7}
.bwe-btn-publish{min-width:104px;justify-content:center;background:var(--bwe-publish);border-color:var(--bwe-publish);color:#fff;font-weight:600}
.bwe-btn-publish:hover:not(:disabled){background:var(--bwe-publish-hover);border-color:var(--bwe-publish-hover)}
.bwe-btn-publish:disabled{opacity:1;background:#fff;border-color:#b2e3cf;color:var(--bwe-publish)}
.bwe-btn-ghost{background:none;border-color:transparent}
.bwe-btn-ghost:hover{background:#f2f4f7;border-color:transparent}
.bwe-btn:disabled{opacity:.55;cursor:default}
.bwe-btn-sm{height:26px;padding:0 10px;font-size:12px}
.bwe-btn-danger{color:var(--bwe-danger)}
.bwe-panel{grid-row:2;background:var(--bwe-panel);border-right:1px solid var(--bwe-line);display:flex;flex-direction:column;min-height:0}
.bwe-panel-head{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--bwe-line);min-height:48px}
.bwe-panel-head h2{font-size:14px;margin:0;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bwe-panel-body{flex:1;overflow:auto;min-height:0}
.bwe-tabs{display:flex;border-bottom:1px solid var(--bwe-line)}
.bwe-tab{flex:1;height:38px;border:0;background:none;border-bottom:2px solid transparent;color:var(--bwe-muted);font-weight:500}
.bwe-tab[aria-selected=true]{color:var(--bwe-accent);border-bottom-color:var(--bwe-accent)}
.bwe-search{position:relative;display:block;margin:12px}
.bwe-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--bwe-muted)}
.bwe-search input{width:100%;height:34px;padding:0 10px 0 32px;border:1px solid var(--bwe-line-2);border-radius:var(--bwe-radius);background:#fafbfc}
.bwe-cat{padding:4px 12px 14px}
.bwe-cat h3{margin:6px 0 8px;font-size:11px;font-weight:600;color:var(--bwe-muted);letter-spacing:.02em}
.bwe-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.bwe-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;height:78px;padding:6px;border:1px solid var(--bwe-line);border-radius:var(--bwe-radius);background:#fff;cursor:grab;text-align:center;font-size:12px;user-select:none}
.bwe-tile:hover{border-color:var(--bwe-accent);color:var(--bwe-accent);box-shadow:0 1px 3px rgba(20,30,60,.08)}
.bwe-tile svg{color:var(--bwe-muted)}
.bwe-tile:hover svg{color:var(--bwe-accent)}
.bwe-section{border-bottom:1px solid var(--bwe-line)}
.bwe-section>button{display:flex;width:100%;align-items:center;justify-content:space-between;height:44px;padding:0 16px;border:0;background:none;font-weight:600;font-size:13px;text-align:left}
.bwe-section>button:hover{background:#fafbfc}
.bwe-section>button[aria-expanded=true]{color:var(--bwe-accent)}
.bwe-section>button svg{color:var(--bwe-muted);transition:transform .15s}
.bwe-section>button[aria-expanded=true] svg{transform:rotate(180deg)}
.bwe-section-body{padding:4px 16px 18px;display:flex;flex-direction:column;gap:14px}
.bwe-field{display:flex;flex-direction:column;gap:6px}
.bwe-field.is-inline{display:grid;grid-template-columns:minmax(0,42%) minmax(0,1fr);align-items:center;column-gap:10px;row-gap:4px}
.bwe-field.is-inline>.bwe-desc{grid-column:1/3}
.bwe-field.is-inline>.bwe-field-row{min-width:0}
.bwe-field.is-inline .bwe-control{min-width:0;display:flex;justify-content:flex-end;align-items:center;gap:4px}
.bwe-field.is-inline .bwe-control>.bwe-select,.bwe-field.is-inline .bwe-control>.bwe-input{flex:1}
.bwe-field-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.bwe-label{display:flex;align-items:center;gap:4px;min-width:0;font-size:12px;font-weight:500;color:#434a56}
.bwe-desc{font-size:11px;color:var(--bwe-muted);margin:0}
.bwe-heading{display:flex;align-items:center;gap:8px;margin:4px 0 -4px;font-size:11px;font-weight:600;color:var(--bwe-muted)}
.bwe-heading::after{content:"";flex:1;height:1px;background:var(--bwe-line)}
.bwe-input,.bwe-select,.bwe-textarea{width:100%;min-height:32px;padding:5px 9px;border:1px solid var(--bwe-line-2);border-radius:5px;background:#fff;transition:border-color .12s,box-shadow .12s}
.bwe-input:hover,.bwe-select:hover,.bwe-textarea:hover{border-color:#b8bfca}
.bwe-select{padding-right:4px}
.bwe-textarea{resize:vertical;min-height:70px}
.bwe-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
.bwe-input:focus,.bwe-select:focus,.bwe-textarea:focus{border-color:var(--bwe-accent);outline:none;box-shadow:0 0 0 2px var(--bwe-accent-soft)}
.bwe-inline{display:flex;gap:6px;align-items:center}
.bwe-inline>.bwe-input{flex:1;min-width:0}
.bwe-unit{width:62px;flex:none}
.bwe-range{flex:1;min-width:0;accent-color:var(--bwe-accent)}
.bwe-num{width:64px;flex:none}
.bwe-dims{display:grid;grid-template-columns:repeat(4,1fr) 30px;gap:4px;align-items:end}
.bwe-dims label{display:flex;flex-direction:column;gap:2px;font-size:10px;color:var(--bwe-muted);text-align:center}
.bwe-dims input{text-align:center;padding:4px 2px}
.bwe-choose{display:flex;border:1px solid var(--bwe-line-2);border-radius:5px;overflow:hidden}
.bwe-choose button{flex:1;min-height:30px;border:0;border-right:1px solid var(--bwe-line);background:#fff;font-size:11px;padding:2px 6px;white-space:nowrap}
.bwe-choose button:hover{background:#f4f6f9}
.bwe-choose button:last-child{border-right:0}
.bwe-choose button[aria-pressed=true]{background:var(--bwe-accent);color:#fff}
.bwe-switch{position:relative;width:34px;height:20px;flex:none;border-radius:20px;border:0;background:#cfd4dc;transition:background .15s}
.bwe-switch::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.bwe-switch[aria-checked=true]{background:var(--bwe-accent)}
.bwe-switch[aria-checked=true]::after{transform:translateX(14px)}
.bwe-color{display:flex;gap:6px;align-items:center}
.bwe-swatch{position:relative;width:30px;height:30px;flex:none;border-radius:5px;border:1px solid var(--bwe-line-2);overflow:hidden;background-image:linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%),linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.bwe-swatch span{position:absolute;inset:0}
.bwe-swatch input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.bwe-chip{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:2px 4px 2px 8px;border-radius:5px;background:var(--bwe-accent-soft);color:var(--bwe-accent);font-weight:500;flex:1;min-width:0}
.bwe-chip span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bwe-chip button{border:0;background:none;color:inherit;display:flex;padding:2px}
.bwe-mini{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid transparent;border-radius:4px;background:none;color:var(--bwe-muted);flex:none}
.bwe-mini:hover{background:#f0f2f5;color:var(--bwe-text)}
.bwe-mini[aria-pressed=true]{color:var(--bwe-accent);background:var(--bwe-accent-soft)}
.bwe-pop{position:relative}
.bwe-menu{position:absolute;right:0;top:calc(100% + 4px);z-index:20;min-width:200px;max-height:280px;overflow:auto;padding:4px;background:#fff;border:1px solid var(--bwe-line-2);border-radius:var(--bwe-radius);box-shadow:0 8px 24px rgba(20,30,60,.14)}
.bwe-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;border-radius:4px;background:none;text-align:left}
.bwe-menu button:hover{background:#f2f4f7}
.bwe-menu h4{margin:6px 8px 2px;font-size:10px;color:var(--bwe-muted);font-weight:600}
.bwe-dot{width:14px;height:14px;border-radius:50%;border:1px solid rgba(0,0,0,.12);flex:none}
.bwe-group{display:flex;flex-direction:column;gap:12px;padding:12px;border:1px solid var(--bwe-line);border-radius:8px;background:#f8f9fb}
.bwe-media{display:flex;flex-direction:column;gap:6px}
.bwe-media-preview{aspect-ratio:16/9;border:1px dashed var(--bwe-line-2);border-radius:5px;background:#f6f7f9 center/contain no-repeat;display:flex;align-items:center;justify-content:center;color:var(--bwe-muted)}
.bwe-rep{display:flex;flex-direction:column;gap:6px}
.bwe-rep-item{border:1px solid var(--bwe-line);border-radius:8px;background:#fff;transition:border-color .12s,box-shadow .12s}
.bwe-rep-item:hover{border-color:#c9ced8}
.bwe-rep-item.is-open{border-color:var(--bwe-accent);box-shadow:0 0 0 3px var(--bwe-accent-soft)}
.bwe-rep-item.is-drop{box-shadow:0 -2px 0 var(--bwe-accent)}
.bwe-rep-head{display:flex;align-items:center;gap:2px;padding:0 4px 0 8px;min-height:34px}
.bwe-rep-head>button:first-of-type{flex:1;display:flex;align-items:center;gap:6px;min-width:0;border:0;background:none;text-align:left;padding:6px 0;font-weight:500}
.bwe-rep-head>button:first-of-type span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bwe-rep-type{font-size:10px;color:var(--bwe-muted);font-weight:400;background:#f0f2f5;border-radius:3px;padding:1px 5px}
.bwe-grip{cursor:grab;color:var(--bwe-muted);display:flex}
.bwe-rep-body{padding:12px;border-top:1px solid var(--bwe-line);display:flex;flex-direction:column;gap:14px;background:#fcfcfd;border-radius:0 0 8px 8px}
.bwe-rule{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:6px;border:1px solid var(--bwe-line);border-radius:5px;background:#fff}
.bwe-rule .bwe-wide{grid-column:1/3;display:flex;gap:4px}
.bwe-empty{padding:28px 20px;text-align:center;color:var(--bwe-muted)}
.bwe-stage{grid-row:2;position:relative;min-width:0;min-height:0;display:flex;justify-content:center;overflow:hidden}
.bwe-device{position:relative;height:100%;transition:width .2s ease;background:#fff;box-shadow:0 0 0 1px var(--bwe-line)}
.bwe-device.is-paper{margin:20px 0;height:calc(100% - 40px);box-shadow:0 4px 24px rgba(20,30,60,.15)}
.bwe-device iframe{display:block;width:100%;height:100%;border:0;background:#fff}
.bwe-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.bwe-box{position:absolute;border:1px solid transparent}
.bwe-box.is-hover{border:1px dashed rgba(59,91,219,.7)}
.bwe-box.is-hover.is-frame{border-style:solid;border-color:rgba(59,91,219,.35)}
.bwe-box.is-selected{border:2px solid var(--bwe-accent)}
.bwe-tag{position:absolute;left:-2px;display:flex;align-items:center;gap:1px;height:24px;padding:0 2px 0 8px;border-radius:4px 4px 0 0;background:var(--bwe-accent);color:#fff;font-size:11px;font-weight:500;white-space:nowrap;pointer-events:auto}
.bwe-tag.is-below{border-radius:0 0 4px 4px}
.bwe-tag.is-inside{border-radius:0 0 4px 0}
.bwe-tag button{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;background:none;color:#fff;border-radius:3px}
.bwe-tag button:hover{background:rgba(255,255,255,.2)}
.bwe-tag .bwe-drag{cursor:grab}
.bwe-hover-label{position:absolute;left:0;top:0;padding:1px 6px;background:rgba(59,91,219,.85);color:#fff;font-size:10px;border-radius:0 0 3px 0}
.bwe-drop-line{position:absolute;background:var(--bwe-accent);border-radius:2px;box-shadow:0 0 0 2px rgba(59,91,219,.25)}
.bwe-drop-inside{position:absolute;border:2px dashed var(--bwe-accent);background:rgba(59,91,219,.06);border-radius:4px}
.bwe-nav{position:absolute;right:12px;top:12px;bottom:12px;width:260px;display:flex;flex-direction:column;background:#fff;border:1px solid var(--bwe-line);border-radius:8px;box-shadow:0 8px 24px rgba(20,30,60,.12);z-index:5}
.bwe-nav ul{list-style:none;margin:0;padding:0}
.bwe-nav-item{display:flex;align-items:center;gap:6px;height:28px;padding-right:6px;border-radius:4px;cursor:pointer;white-space:nowrap}
.bwe-nav-item:hover{background:#f2f4f7}
.bwe-nav-item[aria-current=true]{background:var(--bwe-accent-soft);color:var(--bwe-accent)}
.bwe-nav-item span{overflow:hidden;text-overflow:ellipsis}
.bwe-modal-back{position:fixed;inset:0;z-index:10010;background:rgba(15,20,35,.45);display:flex;align-items:center;justify-content:center;padding:24px}
.bwe-modal{width:min(760px,100%);max-height:min(640px,100%);display:flex;flex-direction:column;background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:hidden}
.bwe-modal header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--bwe-line)}
.bwe-modal header h2{margin:0;font-size:15px;flex:1}
.bwe-modal-body{padding:16px;overflow:auto;display:flex;flex-direction:column;gap:12px}
.bwe-list{display:flex;flex-direction:column;border:1px solid var(--bwe-line);border-radius:var(--bwe-radius)}
.bwe-list-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid var(--bwe-line)}
.bwe-list-row:last-child{border-bottom:0}
.bwe-list-row strong{flex:1;font-weight:500}
.bwe-badge{font-size:11px;padding:1px 6px;border-radius:3px;background:#f0f2f5;color:var(--bwe-muted)}
.bwe-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.bwe-media-grid button{aspect-ratio:1;border:1px solid var(--bwe-line);border-radius:5px;background:#f6f7f9 center/cover no-repeat;padding:0}
.bwe-media-grid button:hover{outline:2px solid var(--bwe-accent)}
.bwe-toasts{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:10020;display:flex;flex-direction:column;gap:6px;align-items:center}
.bwe-toast{padding:8px 14px;border-radius:6px;background:#1d2129;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.2)}
.bwe-toast.is-error{background:var(--bwe-danger)}
.bwe-toast.is-success{background:var(--bwe-ok)}
.bwe-status{font-size:12px;color:var(--bwe-muted);padding:0 6px;white-space:nowrap}
.bwe-rte{border:1px solid var(--bwe-line-2);border-radius:5px;background:#fff}
.bwe-rte-bar{display:flex;flex-wrap:wrap;gap:2px;padding:3px;border-bottom:1px solid var(--bwe-line)}
.bwe-rte-bar button{min-width:26px;height:24px;border:0;border-radius:3px;background:none;font-size:12px}
.bwe-rte-bar button:hover{background:#f0f2f5}
.bwe-rte-area{min-height:120px;max-height:320px;overflow:auto;padding:8px;outline:none}
.bwe-rte-area p{margin:0 0 .6em}
.bwe-rte-html{border:0;border-radius:0 0 5px 5px;min-height:120px}
`

/** Styles injected into the canvas iframe. */
export const CANVAS_CSS = `
html,body{margin:0;min-height:100%}
body{font-family:var(--bw-t-text-font-family,system-ui,sans-serif);color:var(--bw-c-text,#1f2937);line-height:1.6;-webkit-font-smoothing:antialiased;padding-bottom:40px}
[data-bw-id]{cursor:default}
a,button{cursor:default!important}
[class*="bw-anim-"]{animation:none!important}
.bwe-paper{padding:60px}
.bw-frame-empty{display:flex;align-items:center;justify-content:center;color:#8a93a3;font:13px system-ui,sans-serif}
.bw-frame-empty::after{content:"Drag widgets here"}
.bwe-add{margin:24px auto;max-width:720px;padding:18px;border:2px dashed #c5cad3;border-radius:8px;text-align:center;font:13px/1.4 system-ui,sans-serif;color:#687080}
.bwe-add.is-empty{margin-top:40px;padding:48px 18px}
.bwe-add strong{display:block;margin-bottom:10px;color:#1d2129;font-size:14px}
.bwe-structs{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:6px}
.bwe-struct{display:flex;gap:3px;width:78px;height:40px;padding:4px;border:1px solid #d3d7de;border-radius:5px;background:#fff;cursor:pointer!important}
.bwe-struct:hover{border-color:#3b5bdb}
.bwe-struct span{background:#d8dde6;border-radius:2px}
.bwe-struct:hover span{background:#3b5bdb}
`

export const EXTRA_CSS = `
.bwe-zoom{position:absolute;right:10px;bottom:10px;z-index:4;padding:2px 8px;border-radius:10px;background:rgba(29,33,41,.75);color:#fff;font-size:11px;pointer-events:none}
.bwe-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.bwe-gallery-item{position:relative;aspect-ratio:1;border-radius:5px;background:#eef0f3 center/cover no-repeat;cursor:grab;border:1px solid var(--bwe-line)}
.bwe-gallery-item button{position:absolute;top:2px;right:2px;display:none;width:20px;height:20px;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;padding:0}
.bwe-gallery-item:hover button{display:flex}
.bwe-gallery-add{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:1px dashed var(--bwe-line-2);border-radius:5px;background:#fff;color:var(--bwe-accent)}
.bwe-gallery-add:hover{border-color:var(--bwe-accent);background:var(--bwe-accent-soft)}
.bwe-thumb{position:relative;overflow:hidden;background:#fff}
.bwe-thumb iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0;background:#fff}
.bwe-library{width:min(1080px,100%);height:min(760px,100%);max-height:none;flex-direction:row}
.bwe-lib-nav{width:210px;flex:none;display:flex;flex-direction:column;gap:2px;padding:14px 10px;background:#f6f7f9;border-right:1px solid var(--bwe-line)}
.bwe-lib-brand{padding:4px 10px 12px;font-weight:700;font-size:15px}
.bwe-lib-nav button{display:flex;align-items:center;gap:10px;height:36px;padding:0 10px;border:0;border-radius:6px;background:none;color:#434a56;text-align:left;font-weight:500}
.bwe-lib-nav button:hover{background:#eceef2}
.bwe-lib-nav button[aria-current=true]{background:#fff;color:var(--bwe-accent);box-shadow:0 1px 2px rgba(20,30,60,.08)}
.bwe-lib-nav-foot{margin-top:auto;padding-top:10px;border-top:1px solid var(--bwe-line)}
.bwe-lib-main{flex:1;min-width:0;display:flex;flex-direction:column}
.bwe-lib-main>header{display:flex;align-items:center;gap:8px;min-height:56px;padding:10px 16px 10px 20px;border-bottom:1px solid var(--bwe-line)}
.bwe-lib-main>header h2{flex:1;margin:0;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bwe-lib-body{flex:1;overflow:auto;padding:18px 20px 24px}
.bwe-lib-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px}
.bwe-pills{display:flex;flex-wrap:wrap;gap:4px}
.bwe-pills button{height:30px;padding:0 12px;border:1px solid var(--bwe-line-2);border-radius:15px;background:#fff;font-size:12px}
.bwe-pills button:hover{border-color:#b8bfca}
.bwe-pills button[aria-pressed=true]{background:var(--bwe-text);border-color:var(--bwe-text);color:#fff}
.bwe-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:16px}
.bwe-card{display:flex;flex-direction:column;border:1px solid var(--bwe-line);border-radius:10px;background:#fff;overflow:hidden;transition:box-shadow .15s,border-color .15s}
.bwe-card:hover{border-color:#c9ced8;box-shadow:0 6px 18px rgba(20,30,60,.08)}
.bwe-card-thumb{position:relative;display:flex;align-items:flex-start;justify-content:center;height:150px;padding:0;border:0;border-bottom:1px solid var(--bwe-line);background:#f3f4f7;overflow:hidden;cursor:zoom-in;color:var(--bwe-muted)}
.bwe-card-thumb>span:not(.bwe-skeleton){align-self:center}
.bwe-card-meta{display:flex;align-items:center;gap:8px;padding:10px 12px}
.bwe-card-meta>div{flex:1;min-width:0;display:flex;flex-direction:column}
.bwe-card-meta strong{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bwe-card-meta span{font-size:11px;color:var(--bwe-muted)}
.bwe-skeleton{position:absolute;inset:0;background:linear-gradient(90deg,#eef0f3 0,#f7f8fa 40%,#eef0f3 80%);background-size:200% 100%;animation:bwe-shimmer 1.2s infinite linear}
@keyframes bwe-shimmer{to{background-position:-200% 0}}
.bwe-lib-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:56px 20px;text-align:center;color:var(--bwe-muted)}
.bwe-lib-empty strong{color:var(--bwe-text);font-size:15px}
.bwe-lib-empty p{margin:0 0 10px;max-width:380px}
.bwe-lib-preview{display:flex;justify-content:center;background:#f3f4f7;border-radius:8px;padding:16px;overflow:auto}
.bwe-lib-preview .bwe-thumb{box-shadow:0 4px 20px rgba(20,30,60,.12);border-radius:4px}
.bwe-save-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 20px;background:var(--bwe-accent-soft);border-bottom:1px solid #d7defb}
.bwe-save-bar>span{flex-basis:100%;font-weight:500}
.bwe-save-bar input{flex:1;min-width:200px}
.bwe-import{display:flex;flex-direction:column;gap:16px}
.bwe-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:180px;padding:24px;border:2px dashed var(--bwe-line-2);border-radius:12px;background:#fafbfc;color:var(--bwe-muted);text-align:center}
.bwe-drop svg{width:28px;height:28px;color:var(--bwe-accent)}
.bwe-drop strong{color:var(--bwe-text);font-size:14px}
.bwe-drop:hover,.bwe-drop.is-over{border-color:var(--bwe-accent);background:var(--bwe-accent-soft)}
.bwe-alert{margin:0;padding:10px 12px;border-radius:6px;background:#fff5f5;color:var(--bwe-danger);border:1px solid #ffc9c9}
.bwe-import-result{display:flex;flex-direction:column;gap:12px;padding:14px;border:1px solid var(--bwe-line);border-radius:10px}
.bwe-import-result .bwe-thumb{border:1px solid var(--bwe-line);border-radius:6px;align-self:center}
.bwe-import-file{display:flex;align-items:center;gap:10px}
.bwe-import-file svg{width:28px;height:28px;color:var(--bwe-accent)}
.bwe-import-file div{display:flex;flex-direction:column}
.bwe-import-file span{font-size:12px;color:var(--bwe-muted)}
.bwe-export{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.bwe-export-card{display:flex;flex-direction:column;gap:8px;padding:18px;border:1px solid var(--bwe-line);border-radius:10px}
.bwe-export-card strong{font-size:14px}
.bwe-export-card p{margin:0;color:var(--bwe-muted)}
.bwe-export-card code{align-self:flex-start;padding:2px 8px;border-radius:4px;background:#f3f4f7;font-size:12px}
.bwe-export-card.is-muted{background:#fafbfc;border-style:dashed}
.bwe-structure{position:fixed;z-index:10005;display:flex;flex-direction:column;min-width:240px;min-height:200px;max-width:90vw;max-height:calc(100vh - 60px);resize:both;overflow:hidden;background:#fff;border:1px solid var(--bwe-line-2);border-radius:10px;box-shadow:0 12px 32px rgba(20,30,60,.18)}
.bwe-structure>header{display:flex;align-items:center;gap:4px;height:42px;padding:0 6px 0 10px;border-bottom:1px solid var(--bwe-line);cursor:move;user-select:none;background:#fafbfc}
.bwe-structure>header h2{flex:1;margin:0;font-size:13px}
.bwe-structure-grip{display:flex;color:var(--bwe-muted)}
.bwe-structure-body{flex:1;overflow:auto;padding:6px}
.bwe-structure ul{list-style:none;margin:0;padding:0}
.bwe-structure>footer{padding:6px 10px;border-top:1px solid var(--bwe-line);font-size:11px;color:var(--bwe-muted)}
.bwe-tree-row{position:relative;display:flex;align-items:center;gap:4px;height:30px;padding-right:6px;border-radius:5px;cursor:pointer;white-space:nowrap}
.bwe-tree-row:hover{background:#f2f4f7}
.bwe-tree-row[aria-current=true]{background:var(--bwe-accent);color:#fff}
.bwe-tree-row[aria-current=true] .bwe-tree-count,.bwe-tree-row[aria-current=true] em{color:rgba(255,255,255,.8)}
.bwe-tree-row.is-drop-before{box-shadow:inset 0 2px 0 var(--bwe-accent)}
.bwe-tree-row.is-drop-after{box-shadow:inset 0 -2px 0 var(--bwe-accent)}
.bwe-tree-row.is-drop-inside{background:var(--bwe-accent-soft);outline:1px dashed var(--bwe-accent)}
.bwe-tree-toggle{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:none;border:0;background:none;color:inherit;padding:0;opacity:.7}
.bwe-tree-icon{display:flex;flex:none;opacity:.8}
.bwe-tree-icon svg{width:15px;height:15px}
.bwe-tree-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.bwe-tree-title em{font-style:normal;color:var(--bwe-muted)}
.bwe-tree-count{font-size:10px;color:var(--bwe-muted)}
.bwe-add-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:34px;border:1px dashed var(--bwe-line-2);border-radius:8px;background:#fff;color:var(--bwe-accent);font-weight:500}
.bwe-add-btn:hover{border-color:var(--bwe-accent);background:var(--bwe-accent-soft)}
.bwe-tokens{display:flex;flex-wrap:wrap;gap:4px}
.bwe-token{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px;border:1px solid var(--bwe-line-2);border-radius:12px;background:#fff;font-size:11px;font-family:ui-monospace,Menlo,Consolas,monospace}
.bwe-token:hover{border-color:var(--bwe-accent);color:var(--bwe-accent)}
.bwe-icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px}
.bwe-icon-grid button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px 8px;border:1px solid var(--bwe-line);border-radius:8px;background:#fff;font-size:10px;color:var(--bwe-muted);text-transform:capitalize}
.bwe-icon-grid button svg{font-size:22px;color:var(--bwe-text)}
.bwe-icon-grid button:hover,.bwe-icon-grid button[aria-pressed=true]{border-color:var(--bwe-accent);color:var(--bwe-accent)}
.bwe-icon-grid button:hover svg{color:var(--bwe-accent)}
`
