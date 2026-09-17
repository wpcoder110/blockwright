const STAR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'/%3E%3C/svg%3E\")"

/** Base form CSS. Loaded once per page, only when a form is present. */
export const FORM_CSS =
  '.bw-form{--bw-col-gap:10px;--bw-row-gap:12px;--bw-label-gap:4px;--bw-danger:#c62828;--bw-ring:color-mix(in srgb,var(--bw-c-accent,#2563eb) 30%,transparent);' +
  '--bw-rating:#f5a623;--bw-step-inactive:#b8bec8;--bw-step-active:var(--bw-c-accent,#2563eb);--bw-step-done:var(--bw-c-primary,#1d3557);' +
  '--bw-step-size:28px;--bw-btn-justify:stretch;--bw-btn-w:100%;--bw-basis:100%}' +
  '.bw-form [hidden]{display:none!important}' +
  '.bw-form-fields{display:flex;flex-wrap:wrap;column-gap:var(--bw-col-gap);row-gap:var(--bw-row-gap)}' +
  '.bw-field-group{display:flex;flex-direction:column;gap:var(--bw-label-gap);flex:0 0 var(--bw-basis);max-width:var(--bw-basis);min-width:0;margin:0;padding:0;border:0}' +
  '.bw-col-100{--bw-basis:100%}.bw-col-80{--bw-basis:calc(80% - var(--bw-col-gap)*0.2)}.bw-col-75{--bw-basis:calc(75% - var(--bw-col-gap)*0.25)}.bw-col-66{--bw-basis:calc(66.6667% - var(--bw-col-gap)*0.3333)}.bw-col-60{--bw-basis:calc(60% - var(--bw-col-gap)*0.4)}.bw-col-50{--bw-basis:calc(50% - var(--bw-col-gap)*0.5)}.bw-col-40{--bw-basis:calc(40% - var(--bw-col-gap)*0.6)}.bw-col-33{--bw-basis:calc(33.3333% - var(--bw-col-gap)*0.6667)}.bw-col-25{--bw-basis:calc(25% - var(--bw-col-gap)*0.75)}.bw-col-20{--bw-basis:calc(20% - var(--bw-col-gap)*0.8)}' +
  '@media (max-width:1024px){.bw-md-col-100{--bw-basis:100%}.bw-md-col-80{--bw-basis:calc(80% - var(--bw-col-gap)*0.2)}.bw-md-col-75{--bw-basis:calc(75% - var(--bw-col-gap)*0.25)}.bw-md-col-66{--bw-basis:calc(66.6667% - var(--bw-col-gap)*0.3333)}.bw-md-col-60{--bw-basis:calc(60% - var(--bw-col-gap)*0.4)}.bw-md-col-50{--bw-basis:calc(50% - var(--bw-col-gap)*0.5)}.bw-md-col-40{--bw-basis:calc(40% - var(--bw-col-gap)*0.6)}.bw-md-col-33{--bw-basis:calc(33.3333% - var(--bw-col-gap)*0.6667)}.bw-md-col-25{--bw-basis:calc(25% - var(--bw-col-gap)*0.75)}.bw-md-col-20{--bw-basis:calc(20% - var(--bw-col-gap)*0.8)}}' +
  '@media (max-width:767px){.bw-sm-col-100{--bw-basis:100%}.bw-sm-col-80{--bw-basis:calc(80% - var(--bw-col-gap)*0.2)}.bw-sm-col-75{--bw-basis:calc(75% - var(--bw-col-gap)*0.25)}.bw-sm-col-66{--bw-basis:calc(66.6667% - var(--bw-col-gap)*0.3333)}.bw-sm-col-60{--bw-basis:calc(60% - var(--bw-col-gap)*0.4)}.bw-sm-col-50{--bw-basis:calc(50% - var(--bw-col-gap)*0.5)}.bw-sm-col-40{--bw-basis:calc(40% - var(--bw-col-gap)*0.6)}.bw-sm-col-33{--bw-basis:calc(33.3333% - var(--bw-col-gap)*0.6667)}.bw-sm-col-25{--bw-basis:calc(25% - var(--bw-col-gap)*0.75)}.bw-sm-col-20{--bw-basis:calc(20% - var(--bw-col-gap)*0.8)}}' +
  '.bw-field-label{font-weight:500;padding:0;line-height:1.3}' +
  '.bw-mark-required .bw-field-label::after{content:"*";color:var(--bw-danger);padding-inline-start:.2em}' +
  '.bw-field{width:100%;font:inherit;font-size:15px;color:#1f2937;background-color:#fff;border:1px solid #c9ced6;border-radius:4px;' +
  'padding:6px 16px;min-height:40px;line-height:1.4;-webkit-appearance:none;appearance:none;transition:border-color .15s,box-shadow .15s}' +
  '.bw-field:focus{outline:none;border-color:var(--bw-c-accent,#2563eb);box-shadow:0 0 0 3px var(--bw-ring)}' +
  '.bw-field::placeholder{color:#8a919c}' +
  '.bw-size-xs{font-size:13px;padding:4px 12px;min-height:33px}.bw-size-md{font-size:16px;padding:7px 18px;min-height:47px}' +
  '.bw-size-lg{font-size:18px;padding:10px 20px;min-height:59px}.bw-size-xl{font-size:20px;padding:12px 24px;min-height:72px}' +
  'textarea.bw-field{min-height:auto;resize:vertical}' +
  '.bw-field[aria-invalid="true"]{border-color:var(--bw-danger)}' +
  '.bw-field-error{margin:0;color:var(--bw-danger);font-size:.85em;line-height:1.3}' +
  '.bw-select-wrap{position:relative}.bw-select-wrap select{padding-inline-end:36px;cursor:pointer}' +
  '.bw-select-wrap::after{content:"";position:absolute;inset-inline-end:16px;top:50%;width:7px;height:7px;border:solid currentColor;' +
  'border-width:0 2px 2px 0;transform:translateY(-70%) rotate(45deg);pointer-events:none;opacity:.55}' +
  '.bw-select-wrap:has(select[multiple])::after{display:none}.bw-select-wrap select[multiple]{padding-inline-end:16px}' +
  '.bw-options{display:flex;flex-direction:column;gap:6px}.bw-options-inline{flex-direction:row;flex-wrap:wrap;gap:6px 20px}' +
  '.bw-option{display:inline-flex;align-items:center;gap:8px}.bw-option input{width:16px;height:16px;margin:0;flex:none;cursor:pointer}' +
  '.bw-option label{cursor:pointer}' +
  '.bw-option input[aria-invalid="true"]{outline:2px solid var(--bw-danger);outline-offset:1px}' +
  '.bw-rating{display:inline-flex;flex-direction:row-reverse;justify-content:flex-end;gap:4px}' +
  '.bw-rating-item{position:relative;display:inline-flex}' +
  '.bw-rating input{position:absolute;opacity:0;width:1px;height:1px;margin:0}' +
  '.bw-rating label{display:block;width:28px;height:28px;cursor:pointer;background-color:var(--bw-step-inactive);' +
  '-webkit-mask:' + STAR + ' center/contain no-repeat;mask:' + STAR + ' center/contain no-repeat;transition:background-color .1s}' +
  '.bw-rating-item:has(input:checked) label,.bw-rating-item:has(input:checked)~.bw-rating-item label,' +
  '.bw-rating-item:hover label,.bw-rating-item:hover~.bw-rating-item label{background-color:var(--bw-rating)}' +
  '.bw-rating input:focus-visible+label{outline:2px solid var(--bw-c-accent,#2563eb);outline-offset:2px}' +
  '.bw-range{display:flex;align-items:center;gap:12px}' +
  '.bw-field[type="range"]{appearance:auto;padding:0;min-height:auto;border:0;background:none;box-shadow:none;accent-color:var(--bw-c-accent,#2563eb)}' +
  '.bw-range-value{min-width:3ch;font-variant-numeric:tabular-nums}' +
  '.bw-hp{position:absolute!important;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}' +
  '.bw-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
  '.bw-submit-group{flex-direction:row;justify-content:var(--bw-btn-justify)}' +
  '.bw-form .bw-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;padding:12px 24px;border:0;border-radius:4px;' +
  'background-color:var(--bw-c-accent,#2563eb);color:#fff;font:inherit;font-size:15px;font-weight:500;line-height:1;cursor:pointer;' +
  'transition:background-color .2s,color .2s,border-color .2s,opacity .2s}' +
  '.bw-form .bw-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
  '.bw-form-submit{width:var(--bw-btn-w)}' +
  '.bw-form .bw-btn-xs{padding:10px 20px;font-size:13px}.bw-form .bw-btn-md{padding:15px 30px;font-size:16px}' +
  '.bw-form .bw-btn-lg{padding:20px 40px;font-size:18px}.bw-form .bw-btn-xl{padding:25px 50px;font-size:20px}' +
  '.bw-form .bw-step-prev{background-color:transparent;color:inherit;box-shadow:inset 0 0 0 1px currentColor}' +
  '.bw-step-nav{display:flex;gap:10px;flex:0 0 100%;justify-content:space-between;margin-top:var(--bw-row-gap)}' +
  '.bw-step-nav .bw-step-next,.bw-step-nav .bw-form-submit{margin-inline-start:auto;width:auto}' +
  '.bw-form[data-enhanced] .bw-step:not(.is-active){display:none}' +
  '.bw-steps{display:flex;gap:10px;list-style:none;margin:0 0 20px;padding:0}' +
  '.bw-step-indicator{display:flex;align-items:center;gap:8px;flex:1;color:var(--bw-step-inactive);font-size:.9em;font-weight:500}' +
  '.bw-step-indicator.is-active{color:var(--bw-step-active)}.bw-step-indicator.is-done{color:var(--bw-step-done)}' +
  '.bw-step-indicator:not(:last-child)::after{content:"";flex:1;height:2px;background:currentColor;opacity:.35}' +
  '.bw-step-number{display:inline-grid;place-items:center;width:var(--bw-step-size);height:var(--bw-step-size);border-radius:50%;' +
  'border:2px solid currentColor;font-weight:600;flex:none;line-height:1}' +
  '.bw-progress{height:8px;border-radius:99px;background-color:#e5e7eb;margin-bottom:6px;overflow:hidden}' +
  '.bw-progress-bar{height:100%;width:var(--bw-progress,0%);border-radius:inherit;background-color:var(--bw-c-accent,#2563eb);transition:width .3s}' +
  '.bw-progress-label{display:block;margin-bottom:20px;font-size:.85em;opacity:.75}' +
  '.bw-form-message{margin-top:16px;padding:10px 14px;border-radius:4px;border:1px solid currentColor;font-size:.95em}' +
  '.bw-form-message:empty{display:none}.bw-form-message[data-state="success"]{color:#1b7f3b}' +
  '.bw-form-message[data-state="error"]{color:var(--bw-danger)}' +
  '.bw-form[aria-busy="true"] .bw-form-submit{opacity:.6;pointer-events:none}' +
  '@media (prefers-reduced-motion:reduce){.bw-form *{transition:none!important}}'
