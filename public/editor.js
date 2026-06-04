;(function () {
  'use strict'

  var PREFIX = '__ve'
  var Z = 999990
  var EASE = 'cubic-bezier(.4,0,.2,1)'
  var EASE_OUT = 'cubic-bezier(0,.7,.3,1)'

  var state = { active: false, selected: null, hovered: null, textEditing: null, history: [], future: [], pages: [], pageMode: 'scroll', currentPage: 0, restoring: false, layoutOpen: false }
  var dom = {}

  // Capture inline script source so restoreHTML can re-inject it in about:srcdoc
  var __ve_script_source = ''
  try {
    var me = document.currentScript
    if (me && !me.src) __ve_script_source = me.textContent || ''
  } catch (e) {}
  // ★ Wrap entire IIFE body, catch all errors
  try {

  function each(list, fn) { Array.prototype.forEach.call(list, fn) }
  function removeNode(node) { if (node && node.parentNode) node.parentNode.removeChild(node) }
  function hasPrefix(value, prefix) { return String(value).slice(0, prefix.length) === prefix }
  function hexByte(value) {
    var hex = (+value).toString(16)
    return hex.length < 2 ? '0' + hex : hex
  }

  var ICON_EDIT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
  var ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'

  // ========== Compound Property Helpers ==========

  function parseCSSFn(str, fn) {
    if (!str || str === 'none') return null
    var m = str.match(new RegExp(fn + '\\(([^)]+)\\)'))
    return m ? m[1] : null
  }

  function setCSSFn(str, fn, val) {
    if (!str || str === 'none') str = ''
    var re = new RegExp(fn + '\\([^)]*\\)')
    if (re.test(str)) return str.replace(re, fn + '(' + val + ')')
    return (str.trim() + ' ' + fn + '(' + val + ')').trim()
  }

  function parseShadow(val) {
    if (!val || val === 'none') return { x: 0, y: 0, blur: 0, spread: 0, color: '#000000' }
    var cm = val.match(/rgba?\([^)]+\)/)
    var color = cm ? rgbToHex(cm[0]) : '#000000'
    var noColor = val.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/g, '').replace(/inset/g, '').trim()
    var nums = noColor.split(/\s+/).map(parseFloat).filter(function (n) { return !isNaN(n) })
    return { x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, color: color }
  }

  function composeShadow(s, hasSpread) {
    var p = [s.x + 'px', s.y + 'px', s.blur + 'px']
    if (hasSpread) p.push(s.spread + 'px')
    p.push(s.color)
    return p.join(' ')
  }

  // ========== Plugin Definitions ==========

  var GROUPS = [
    {
      group: 'Text', collapsed: false,
      controls: [
        { prop: 'fontSize', label: 'Font Size', type: 'slider', min: 12, max: 96, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) } },
        { prop: 'lineHeight', label: 'Line Height', type: 'slider', min: 0.8, max: 3.0, step: 0.05, unit: '',
          parse: function (v, el) { if (v === 'normal') return 1.4; return Math.round(parseFloat(v) / parseFloat(getComputedStyle(el).fontSize) * 100) / 100 },
          format: function (v) { return String(v) } },
        { prop: 'letterSpacing', label: 'Letter Spacing', type: 'slider', min: -2, max: 10, step: 0.5, unit: 'px',
          parse: function (v) { return v === 'normal' ? 0 : parseFloat(v) } },
        { prop: 'fontWeight', label: 'Font Weight', type: 'select',
          options: [
            { value: '100', label: '100 Thin' }, { value: '300', label: '300 Light' },
            { value: '400', label: '400 Regular' }, { value: '500', label: '500 Medium' },
            { value: '600', label: '600 Semi-Bold' }, { value: '700', label: '700 Bold' },
            { value: '900', label: '900 Black' }
          ],
          parse: function (v) { return String(Math.round(parseFloat(v))) } },
        { prop: 'textAlign', label: 'Align', type: 'buttonGroup',
          options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' }] },
        { prop: 'color', label: 'Text Color', type: 'color' }
      ]
    },
    {
      group: 'Background', collapsed: false,
      controls: [
        { prop: 'backgroundColor', label: 'Background Color', type: 'color' },
        { prop: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 1, step: 0.05, unit: '',
          parse: function (v) { return parseFloat(v) },
          format: function (v) { return String(v) } }
      ]
    },
    {
      group: 'Spacing', collapsed: false,
      controls: [
        { prop: 'padding', label: 'Padding', type: 'spacing' },
        { prop: 'margin', label: 'Margin', type: 'spacing' }
      ]
    },
    {
      group: 'Size', collapsed: false,
      controls: [
        { prop: 'width', label: 'Width', type: 'dimension' },
        { prop: 'height', label: 'Height', type: 'dimension' },
        { prop: 'maxWidth', label: 'Max Width', type: 'dimension' },
        { prop: 'minHeight', label: 'Min Height', type: 'dimension' },
        { prop: 'borderRadius', label: 'Border Radius', type: 'slider', min: 0, max: 100, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } }
      ]
    },
    {
      group: 'Position', collapsed: true,
      controls: [
        { prop: 'position', label: 'Position Type', type: 'select',
          options: [
            { value: 'static', label: 'static' }, { value: 'relative', label: 'relative' },
            { value: 'absolute', label: 'absolute' }, { value: 'fixed', label: 'fixed' },
            { value: 'sticky', label: 'sticky' }
          ] },
        { prop: 'top', label: 'Top', type: 'dimension' },
        { prop: 'right', label: 'Right', type: 'dimension' },
        { prop: 'bottom', label: 'Bottom', type: 'dimension' },
        { prop: 'left', label: 'Left', type: 'dimension' },
        { prop: 'zIndex', label: 'Z-Index', type: 'slider', min: -10, max: 100, step: 1, unit: '',
          parse: function (v) { return v === 'auto' ? 0 : parseInt(v) || 0 },
          format: function (v) { return String(Math.round(v)) } }
      ]
    },
    {
      group: 'Border', collapsed: true,
      controls: [
        { prop: 'borderWidth', label: 'Width', type: 'slider', min: 0, max: 20, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } },
        { prop: 'borderStyle', label: 'Style', type: 'select',
          options: [
            { value: 'none', label: 'none' }, { value: 'solid', label: 'solid' },
            { value: 'dashed', label: 'dashed' }, { value: 'dotted', label: 'dotted' },
            { value: 'double', label: 'double' }
          ] },
        { prop: 'borderColor', label: 'Color', type: 'color' }
      ]
    },
    {
      group: 'Typography', collapsed: true,
      controls: [
        { prop: 'fontFamily', label: 'Font Family', type: 'dimension' },
        { prop: 'fontStyle', label: 'Italic', type: 'buttonGroup',
          options: [{ value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Italic' }] },
        { prop: 'textDecorationLine', label: 'Decoration', type: 'buttonGroup',
          options: [{ value: 'none', label: 'None' }, { value: 'underline', label: 'Underline' }, { value: 'line-through', label: 'Line Through' }] },
        { prop: 'textIndent', label: 'Text Indent', type: 'slider', min: 0, max: 80, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } },
        { prop: 'whiteSpace', label: 'White Space', type: 'select',
          options: [
            { value: 'normal', label: 'normal' }, { value: 'nowrap', label: 'nowrap' },
            { value: 'pre-wrap', label: 'pre-wrap' }, { value: 'pre-line', label: 'pre-line' }
          ] },
        { prop: 'wordSpacing', label: 'Word Spacing', type: 'slider', min: -5, max: 20, step: 0.5, unit: 'px',
          parse: function (v) { return v === 'normal' ? 0 : parseFloat(v) } }
      ]
    },
    {
      group: 'Layout', collapsed: true,
      controls: [
        { prop: 'display', label: 'Display', type: 'select',
          options: [
            { value: 'block', label: 'block' }, { value: 'inline', label: 'inline' },
            { value: 'inline-block', label: 'inline-block' }, { value: 'flex', label: 'flex' },
            { value: 'inline-flex', label: 'inline-flex' }, { value: 'grid', label: 'grid' },
            { value: 'none', label: 'none' }
          ] },
        { prop: 'flexDirection', label: 'Flex Direction', type: 'buttonGroup',
          options: [{ value: 'row', label: 'Row' }, { value: 'column', label: 'Column' }, { value: 'row-reverse', label: 'Row Rev' }, { value: 'column-reverse', label: 'Col Rev' }] },
        { prop: 'justifyContent', label: 'Justify', type: 'select',
          options: [
            { value: 'flex-start', label: 'start' }, { value: 'center', label: 'center' },
            { value: 'flex-end', label: 'end' }, { value: 'space-between', label: 'between' },
            { value: 'space-around', label: 'around' }, { value: 'space-evenly', label: 'evenly' }
          ] },
        { prop: 'alignItems', label: 'Align', type: 'select',
          options: [
            { value: 'stretch', label: 'stretch' }, { value: 'flex-start', label: 'start' },
            { value: 'center', label: 'center' }, { value: 'flex-end', label: 'end' },
            { value: 'baseline', label: 'baseline' }
          ] },
        { prop: 'flexWrap', label: 'Flex Wrap', type: 'buttonGroup',
          options: [{ value: 'nowrap', label: 'No Wrap' }, { value: 'wrap', label: 'White Space' }] },
        { prop: 'gap', label: 'Gap', type: 'slider', min: 0, max: 60, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } },
        { prop: 'overflow', label: 'Overflow', type: 'select',
          options: [
            { value: 'visible', label: 'visible' }, { value: 'hidden', label: 'hidden' },
            { value: 'scroll', label: 'scroll' }, { value: 'auto', label: 'auto' }
          ] }
      ]
    },
    {
      group: 'Shadow', collapsed: true,
      controls: [
        { prop: 'boxShadow', label: 'Box Shadow', type: 'shadow', hasSpread: true },
        { prop: 'textShadow', label: 'Text Shadow', type: 'shadow', hasSpread: false }
      ]
    },
    {
      group: 'Effects', collapsed: true,
      controls: [
        { prop: 'filter', subFn: 'blur', label: 'Blur', type: 'compoundSlider', min: 0, max: 20, step: 0.5, unit: 'px', defaultVal: 0 },
        { prop: 'filter', subFn: 'brightness', label: 'Brightness', type: 'compoundSlider', min: 0, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'filter', subFn: 'contrast', label: 'Contrast', type: 'compoundSlider', min: 0, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'filter', subFn: 'saturate', label: 'Saturate', type: 'compoundSlider', min: 0, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'filter', subFn: 'grayscale', label: 'Grayscale', type: 'compoundSlider', min: 0, max: 1, step: 0.05, unit: '', defaultVal: 0 },
        { prop: 'backdropFilter', subFn: 'blur', label: 'Backdrop Blur', type: 'compoundSlider', min: 0, max: 30, step: 1, unit: 'px', defaultVal: 0 }
      ]
    },
    {
      group: 'Transform', collapsed: true,
      controls: [
        { prop: 'transform', subFn: 'rotate', label: 'Rotate', type: 'compoundSlider', min: -180, max: 180, step: 1, unit: 'deg', defaultVal: 0 },
        { prop: 'transform', subFn: 'scale', label: 'Scale', type: 'compoundSlider', min: 0.1, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'transform', subFn: 'translateX', label: 'TX', type: 'compoundSlider', min: -200, max: 200, step: 1, unit: 'px', defaultVal: 0 },
        { prop: 'transform', subFn: 'translateY', label: 'TY', type: 'compoundSlider', min: -200, max: 200, step: 1, unit: 'px', defaultVal: 0 }
      ]
    }
  ]

  // ========== CSS ==========
  var P = '.' + PREFIX + '-'
  var CSS = '\
#' + PREFIX + '-root{all:initial;position:fixed;top:0;left:0;right:0;bottom:0;z-index:' + Z + ';pointer-events:none;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#d8dee9;line-height:1.4}\
#' + PREFIX + '-root *,#' + PREFIX + '-root *::before,#' + PREFIX + '-root *::after{box-sizing:border-box}\
' + P + 'toggle{position:fixed;top:24px;right:24px;width:48px;height:48px;border-radius:14px;background:#2563eb;color:#fff;border:1px solid rgba(255,255,255,.16);cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:auto;box-shadow:0 12px 30px rgba(15,23,42,.35);transition:transform .25s ' + EASE_OUT + ',background .3s ' + EASE + ',box-shadow .3s ' + EASE + ';z-index:' + (Z + 9) + '}\
' + P + 'toggle:hover{transform:translateY(2px);background:#1d4ed8;box-shadow:0 16px 36px rgba(37,99,235,.3)}\
' + P + 'toggle:active{transform:scale(0.92);transition-duration:.1s}\
' + P + 'toggle.active{display:none}\
' + P + 'toolbar{position:fixed;top:16px;right:16px;width:auto;max-width:calc(100vw - 32px);min-height:42px;background:rgba(15,23,42,.96);border:1px solid rgba(148,163,184,.22);border-radius:10px;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;padding:6px;gap:6px;pointer-events:auto;opacity:0;transform:translateY(-16px);transition:opacity .3s ' + EASE + ',transform .35s ' + EASE_OUT + ';z-index:' + (Z + 5) + ';box-shadow:0 18px 45px rgba(2,6,23,.28);-webkit-backdrop-filter:blur(16px) saturate(1.15);backdrop-filter:blur(16px) saturate(1.15)}\
' + P + 'toolbar.visible{opacity:1;transform:translateY(0)}\
' + P + 'tb-btn{height:30px;padding:0 11px;border-radius:7px;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.045);color:#cbd5e1;cursor:pointer;font-size:12px;white-space:nowrap;font-family:inherit;line-height:28px;transition:all .15s ' + EASE + '}\
' + P + 'tb-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(148,163,184,.3);color:#f8fafc}\
' + P + 'tb-btn:active{transform:scale(0.95);transition-duration:.08s}\
' + P + 'tb-btn.primary{background:#2563eb;border-color:#3b82f6;color:#fff}\
' + P + 'tb-btn.primary:hover{background:#1d4ed8;box-shadow:0 8px 18px rgba(37,99,235,.28)}\
' + P + 'tb-btn.primary:active{background:#1e40af}\
' + P + 'tb-btn:disabled{opacity:.45;cursor:default;transform:none!important;box-shadow:none!important}\
' + P + 'tb-btn.exit{background:transparent;border:none;color:#94a3b8;padding:0 8px;font-size:16px;transition:color .15s ' + EASE + ',transform .15s ' + EASE + '}\
' + P + 'tb-btn.exit:hover{color:#fff;transform:scale(1.15)}\
' + P + 'tb-btn.exit:active{transform:scale(0.9);transition-duration:.08s}\
' + P + 'pager{display:flex;align-items:center;gap:4px;padding:0 6px;margin:0 2px;border-left:1px solid rgba(148,163,184,.16);border-right:1px solid rgba(148,163,184,.16)}\
' + P + 'pager.hidden{display:none}\
' + P + 'page-label{min-width:44px;text-align:center;color:#93c5fd;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'breadcrumb{display:none;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'panel{position:fixed;top:70px;right:16px;width:min(348px,calc(100vw - 32px));bottom:16px;background:rgba(11,18,32,.97);border:1px solid rgba(148,163,184,.2);border-radius:12px;overflow-x:hidden;overflow-y:auto;pointer-events:auto;opacity:0;transform:translateX(24px);transition:opacity .3s ' + EASE + ',transform .4s ' + EASE_OUT + ';z-index:' + (Z + 4) + ';box-shadow:0 24px 70px rgba(2,6,23,.36);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}\
' + P + 'panel.visible{opacity:1;transform:translateX(0)}\
' + P + 'tb-btn.active{background:#334155;border-color:#60a5fa;color:#fff}\
' + P + 'panel-title{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid rgba(148,163,184,.14);background:rgba(11,18,32,.98);color:#f8fafc;font-size:13px;font-weight:700}\
' + P + 'panel-subtitle{font-size:11px;font-weight:500;color:#64748b}\
' + P + 'panel-empty{padding:40px 22px;text-align:center;color:#64748b;font-size:13px;line-height:1.7}\
' + P + 'panel::-webkit-scrollbar{width:6px}\
' + P + 'panel::-webkit-scrollbar-track{background:transparent}\
' + P + 'panel::-webkit-scrollbar-thumb{background:rgba(148,163,184,.3);border-radius:999px}\
' + P + 'panel-inner{transition:opacity .15s ' + EASE + '}\
' + P + 'panel-inner.fade{opacity:0}\
' + P + 'group{border-bottom:1px solid rgba(148,163,184,.09)}\
' + P + 'group-hd{padding:13px 14px 7px;font-size:12px;font-weight:700;color:#e2e8f0;letter-spacing:0;cursor:pointer;user-select:none;display:flex;align-items:center;transition:color .15s,background .15s}\
' + P + 'group-hd:hover{color:#fff;background:rgba(255,255,255,.025)}\
' + P + 'group-hd::before{content:"▾";display:inline-block;margin-right:6px;font-size:9px;transition:transform .25s ' + EASE_OUT + '}\
' + P + 'group.collapsed ' + P + 'group-hd::before{transform:rotate(-90deg)}\
' + P + 'group-bd{overflow:hidden;max-height:800px;opacity:1;padding:4px 14px 14px;transition:max-height .3s ' + EASE + ',opacity .2s ' + EASE + ',padding .25s ' + EASE + '}\
' + P + 'group.collapsed ' + P + 'group-bd{max-height:0;opacity:0;padding-top:0;padding-bottom:0}\
' + P + 'ctrl{margin-bottom:12px}\
' + P + 'ctrl-label{font-size:11px;color:#94a3b8;margin-bottom:7px}\
' + P + 'ctrl-row{display:flex;align-items:center;gap:10px}\
' + P + 'slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;background:#334155;border-radius:999px;outline:none;cursor:pointer;transition:background .15s ' + EASE + '}\
' + P + 'slider:hover{background:#475569}\
' + P + 'slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#60a5fa;cursor:pointer;border:2px solid #dbeafe;box-shadow:0 2px 8px rgba(2,6,23,.35);transition:transform .15s ' + EASE_OUT + ',box-shadow .15s ' + EASE + '}\
' + P + 'slider:hover::-webkit-slider-thumb{transform:scale(1.18);box-shadow:0 4px 12px rgba(96,165,250,.35)}\
' + P + 'slider:active::-webkit-slider-thumb{transform:scale(1.08);background:#3b82f6}\
' + P + 'slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#60a5fa;cursor:pointer;border:2px solid #dbeafe;box-shadow:0 2px 8px rgba(2,6,23,.35)}\
' + P + 'num{width:58px;height:28px;padding:0 6px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;text-align:center;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'num:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'color-row{display:flex;align-items:center;gap:10px}\
' + P + 'color-input{width:34px;height:28px;border:1px solid rgba(148,163,184,.2);border-radius:7px;padding:2px;cursor:pointer;background:rgba(15,23,42,.72);outline:none;transition:border-color .15s ' + EASE + ',transform .15s ' + EASE_OUT + '}\
' + P + 'color-input:hover{border-color:#60a5fa;transform:translateY(-1px)}\
' + P + 'color-input::-webkit-color-swatch-wrapper{padding:0}\
' + P + 'color-input::-webkit-color-swatch{border:none;border-radius:5px}\
' + P + 'color-hex{width:92px;height:28px;padding:0 8px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'color-hex:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'select{width:100%;height:30px;padding:0 9px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'select:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'btn-group{display:flex}\
' + P + 'bg-item{flex:1;height:30px;padding:0 8px;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.14);color:#94a3b8;cursor:pointer;font-size:12px;text-align:center;font-family:inherit;transition:all .2s ' + EASE + '}\
' + P + 'bg-item:first-child{border-radius:7px 0 0 7px}\
' + P + 'bg-item:last-child{border-radius:0 7px 7px 0}\
' + P + 'bg-item+' + P + 'bg-item{border-left:none}\
' + P + 'bg-item:hover{background:rgba(255,255,255,.08);color:#e2e8f0}\
' + P + 'bg-item:active{transform:scaleY(0.93);transition-duration:.08s}\
' + P + 'bg-item.active{background:#2563eb;border-color:#3b82f6;color:#fff;box-shadow:0 6px 14px rgba(37,99,235,.22)}\
' + P + 'sp-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px}\
' + P + 'sp-label{font-size:10px;color:#64748b;text-align:center;margin-bottom:3px}\
' + P + 'sp-input{width:100%;height:28px;padding:0 3px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:11px;text-align:center;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'sp-input:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'dim-input{width:100%;height:30px;padding:0 9px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'dim-input:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'shadow-label{width:28px;font-size:11px;color:#94a3b8;flex-shrink:0}\
' + P + 'hover-ov{position:fixed;pointer-events:none;border:1px dashed rgba(96,165,250,.75);background:rgba(96,165,250,.08);transition:top .1s ' + EASE + ',left .1s ' + EASE + ',width .1s ' + EASE + ',height .1s ' + EASE + ';z-index:' + (Z + 1) + ';display:none}\
' + P + 'sel-ov{position:fixed;pointer-events:none;border:1px solid #60a5fa;background:rgba(96,165,250,.07);box-shadow:0 0 0 1px rgba(15,23,42,.7),0 0 0 4px rgba(96,165,250,.12);z-index:' + (Z + 2) + ';display:none;animation:' + PREFIX + '-pop .2s ' + EASE_OUT + '}\
@keyframes ' + PREFIX + '-pop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}\
' + P + 'ov-tag{position:absolute;top:-22px;left:-1px;background:#2563eb;color:#fff;font-size:10px;padding:3px 7px;border-radius:6px 6px 0 0;font-family:"SF Mono",Monaco,Consolas,monospace;white-space:nowrap}\
' + P + 'toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(8px);background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.18);color:#f8fafc;padding:9px 18px;border-radius:999px;font-size:13px;z-index:' + (Z + 9) + ';pointer-events:none;opacity:0;box-shadow:0 16px 35px rgba(2,6,23,.32);transition:opacity .25s ' + EASE + ',transform .25s ' + EASE_OUT + '}\
' + P + 'toast.show{opacity:1;transform:translateX(-50%) translateY(0)}\
' + P + 'el-info{padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);display:flex;align-items:baseline;gap:7px;background:rgba(255,255,255,.025)}\
' + P + 'el-tag{font-size:13px;font-weight:650;color:#93c5fd;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'el-dim{font-size:11px;color:#64748b;font-family:"SF Mono",Monaco,Consolas,monospace}\
@media (max-width:720px){\
' + P + 'toggle{right:16px;bottom:16px;width:46px;height:46px}\
' + P + 'toolbar{top:8px;left:8px;right:8px;max-width:none;justify-content:flex-start;max-height:120px;overflow:auto}\
' + P + 'tb-btn{height:32px;line-height:30px;padding:0 10px}\
' + P + 'pager{margin-left:0;padding-left:4px;padding-right:4px;border-left:none}\
' + P + 'panel{top:auto;left:8px;right:8px;width:auto;height:42vh;max-height:360px;bottom:8px;border-radius:12px}\
' + P + 'panel-empty{padding:32px 16px}\
' + P + 'sp-grid{gap:5px}\
' + P + 'toast{bottom:24px;max-width:calc(100vw - 24px);text-align:center}\
}\
'

  // ========== Utilities ==========

  function isVE(el) {
    if (!el) return true
    if (!el.closest) { el = el.parentElement; if (!el || !el.closest) return true }
    return el.id === PREFIX + '-root' || !!el.closest('#' + PREFIX + '-root') ||
           !!el.closest('.' + PREFIX + '-toggle') ||
           el.hasAttribute('data-ve-ui') || !!el.closest('[data-ve-ui]')
  }

  function elPath(el) {
    var parts = []
    var cur = el
    while (cur && cur !== document.body && cur !== document.documentElement) {
      var tag = cur.tagName.toLowerCase()
      if (cur.id && !hasPrefix(cur.id, PREFIX)) tag += '#' + cur.id
      else if (cur.className && typeof cur.className === 'string') {
        var cls = cur.className.split(/\s+/).filter(function (c) { return c && !hasPrefix(c, PREFIX) }).slice(0, 2)
        if (cls.length) tag += '.' + cls.join('.')
      }
      parts.unshift(tag)
      cur = cur.parentElement
    }
    return parts.join(' › ')
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return 'transparent'
    var m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return hasPrefix(rgb, '#') ? rgb : '#000000'
    return '#' + [m[1], m[2], m[3]].map(hexByte).join('')
  }

  function cs(el, prop) { return getComputedStyle(el)[prop] }
  function round(v) { return Math.round(v * 100) / 100 }

  function showToast(msg, ms) {
    dom.toast.textContent = msg
    dom.toast.classList.add('show')
    clearTimeout(dom.toast._t)
    dom.toast._t = setTimeout(function () { dom.toast.classList.remove('show') }, ms || 2000)
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag)
    if (cls) e.className = cls
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]
      else if (k === 'html') e.innerHTML = attrs[k]
      else e.setAttribute(k, attrs[k])
    })
    return e
  }

  function bindPress(btn, fn) {
    var pointerHandled = false
    var pointerTimer = null
    function run(e) {
      if (btn.disabled) return
      e.preventDefault()
      e.stopPropagation()
      pointerHandled = true
      clearTimeout(pointerTimer)
      fn()
      pointerTimer = setTimeout(function () { pointerHandled = false }, 700)
    }
    btn.addEventListener('pointerdown', run)
    btn.addEventListener('mousedown', function (e) {
      if (!window.PointerEvent) run(e)
    })
    btn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      if (pointerHandled) {
        pointerHandled = false
        clearTimeout(pointerTimer)
        return
      }
      if (!btn.disabled) fn()
    })
  }

  // ========== CSS Injection ==========

  function injectCSS() {
    var s = document.createElement('style')
    s.setAttribute('data-ve', '1')
    s.textContent = CSS
    document.head.appendChild(s)
  }

  // ========== UI Creation ==========

  function createUI() {
    dom.root = el('div', null)
    dom.root.id = PREFIX + '-root'

    dom.toggle = el('button', PREFIX + '-toggle', { title: 'Toggle edit mode (Alt+E)', html: ICON_EDIT })
    dom.toggle.addEventListener('click', toggleEdit)

    dom.toolbar = el('div', PREFIX + '-toolbar')
    var exitBtn = el('button', PREFIX + '-tb-btn exit', { html: ICON_X, title: 'Exit edit mode' })
    exitBtn.addEventListener('click', exitEdit)
    dom.breadcrumb = el('span', PREFIX + '-breadcrumb')
    var copyBtn = el('button', PREFIX + '-tb-btn', { text: 'Copy HTML' })
    copyBtn.addEventListener('click', copyHTML)
    var dlBtn = el('button', PREFIX + '-tb-btn primary', { text: 'Download HTML' })
    dlBtn.addEventListener('click', downloadHTML)
    dom.layoutBtn = el('button', PREFIX + '-tb-btn', { text: 'Panel', title: 'Show/hide style panel' })
    dom.layoutBtn.addEventListener('click', toggleLayoutPanel)
    dom.textBtn = el('button', PREFIX + '-tb-btn', { text: 'Edit Text', title: 'Edit selected element text (Alt+T)' })
    dom.textBtn.addEventListener('click', startTextEdit)
    dom.undoBtn = el('button', PREFIX + '-tb-btn', { text: 'Undo', title: 'Undo (Alt+Z)' })
    dom.undoBtn.addEventListener('click', undo)
    dom.redoBtn = el('button', PREFIX + '-tb-btn', { text: 'Redo', title: 'Redo (Alt+Y)' })
    dom.redoBtn.addEventListener('click', redo)
    dom.pager = el('div', PREFIX + '-pager')
    dom.prevPageBtn = el('button', PREFIX + '-tb-btn', { text: 'Prev', title: 'Previous page (Alt+Left)' })
    bindPress(dom.prevPageBtn, function () { goPage(-1) })
    dom.pageLabel = el('span', PREFIX + '-page-label', { text: '1/1' })
    dom.nextPageBtn = el('button', PREFIX + '-tb-btn', { text: 'Next', title: 'Next page (Alt+Right)' })
    bindPress(dom.nextPageBtn, function () { goPage(1) })
    dom.pager.appendChild(dom.prevPageBtn)
    dom.pager.appendChild(dom.pageLabel)
    dom.pager.appendChild(dom.nextPageBtn)
    var reloadBtn = el('button', PREFIX + '-tb-btn', { text: 'Reload', title: 'Reload current file' })
    reloadBtn.addEventListener('click', reloadPage)
    dom.toolbar.appendChild(exitBtn)
    dom.toolbar.appendChild(dom.breadcrumb)
    dom.toolbar.appendChild(dom.layoutBtn)
    dom.toolbar.appendChild(dom.textBtn)
    dom.toolbar.appendChild(dom.undoBtn)
    dom.toolbar.appendChild(dom.redoBtn)
    dom.toolbar.appendChild(dom.pager)
    dom.toolbar.appendChild(reloadBtn)
    dom.toolbar.appendChild(copyBtn)
    dom.toolbar.appendChild(dlBtn)
    updateToolbarState()

    dom.panel = el('div', PREFIX + '-panel')
    dom.panelInner = el('div', PREFIX + '-panel-inner')
    dom.panel.appendChild(dom.panelInner)

    dom.hoverOv = el('div', PREFIX + '-hover-ov')
    dom.hoverOv.appendChild(el('span', PREFIX + '-ov-tag'))
    dom.selOv = el('div', PREFIX + '-sel-ov')
    dom.selOv.appendChild(el('span', PREFIX + '-ov-tag'))

    dom.toast = el('div', PREFIX + '-toast')

    dom.root.appendChild(dom.toolbar)
    dom.root.appendChild(dom.panel)
    dom.root.appendChild(dom.hoverOv)
    dom.root.appendChild(dom.selOv)
    dom.root.appendChild(dom.toast)
    document.body.appendChild(dom.root)
    document.body.appendChild(dom.toggle)
  }

  // ========== Control Renderers ==========

  function renderPanel() {
    if (!state.layoutOpen) return
    dom.panelInner.classList.add('fade')
    setTimeout(function () {
      dom.panelInner.innerHTML = ''
      var title = el('div', PREFIX + '-panel-title')
      title.appendChild(el('span', null, { text: 'Style Panel' }))
      if (!state.selected) {
        title.appendChild(el('span', PREFIX + '-panel-subtitle', { text: 'No Selection' }))
        dom.panelInner.appendChild(title)
        dom.panelInner.appendChild(el('div', PREFIX + '-panel-empty', { text: 'Enter edit mode, then click any heading, paragraph, card or button to start editing.' }))
        dom.panelInner.classList.remove('fade')
        return
      }
      var target = state.selected
      title.appendChild(el('span', PREFIX + '-panel-subtitle', { text: target.tagName.toLowerCase() }))
      dom.panelInner.appendChild(title)
      var info = el('div', PREFIX + '-el-info')
      info.appendChild(el('span', PREFIX + '-el-tag', { text: target.tagName.toLowerCase() }))
      var rect = target.getBoundingClientRect()
      info.appendChild(el('span', PREFIX + '-el-dim', { text: Math.round(rect.width) + ' × ' + Math.round(rect.height) }))
      dom.panelInner.appendChild(info)

      GROUPS.forEach(function (g) {
        var section = el('div', PREFIX + '-group' + (g.collapsed ? ' collapsed' : ''))
        var header = el('div', PREFIX + '-group-hd', { text: g.group })
        header.addEventListener('click', function () { section.classList.toggle('collapsed') })
        section.appendChild(header)
        var body = el('div', PREFIX + '-group-bd')
        g.controls.forEach(function (ctrl) { body.appendChild(renderControl(ctrl)) })
        section.appendChild(body)
        dom.panelInner.appendChild(section)
      })
      dom.panelInner.classList.remove('fade')
    }, 80)
  }

  function renderControl(ctrl) {
    var wrap = el('div', PREFIX + '-ctrl')
    wrap.appendChild(el('div', PREFIX + '-ctrl-label', { text: ctrl.label }))
    switch (ctrl.type) {
      case 'slider': buildSlider(wrap, ctrl); break
      case 'color': buildColor(wrap, ctrl); break
      case 'select': buildSelect(wrap, ctrl); break
      case 'buttonGroup': buildBtnGroup(wrap, ctrl); break
      case 'spacing': buildSpacing(wrap, ctrl); break
      case 'dimension': buildDimension(wrap, ctrl); break
      case 'shadow': buildShadow(wrap, ctrl); break
      case 'compoundSlider': buildCompoundSlider(wrap, ctrl); break
    }
    return wrap
  }

  function buildSlider(wrap, ctrl) {
    var target = state.selected
    var raw = cs(target, ctrl.prop)
    var val = ctrl.parse ? ctrl.parse(raw, target) : parseFloat(raw)
    if (isNaN(val)) val = ctrl.min

    var row = el('div', PREFIX + '-ctrl-row')
    var slider = el('input', PREFIX + '-slider')
    slider.type = 'range'
    slider.min = ctrl.min; slider.max = ctrl.max; slider.step = ctrl.step; slider.value = val
    var numInput = el('input', PREFIX + '-num')
    numInput.type = 'text'
    numInput.value = round(val) + (ctrl.unit || '')

    slider.addEventListener('input', function () {
      var v = parseFloat(slider.value)
      numInput.value = round(v) + (ctrl.unit || '')
      applyStyle(ctrl.prop, ctrl.format ? ctrl.format(v, state.selected) : v + (ctrl.unit || ''))
    })
    numInput.addEventListener('change', function () {
      var v = parseFloat(numInput.value)
      if (!isNaN(v)) {
        slider.value = v
        applyStyle(ctrl.prop, ctrl.format ? ctrl.format(v, state.selected) : v + (ctrl.unit || ''))
      }
    })
    row.appendChild(slider); row.appendChild(numInput)
    wrap.appendChild(row)
  }

  function buildColor(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var hex = rgbToHex(raw)
    var row = el('div', PREFIX + '-color-row')
    var cInput = el('input', PREFIX + '-color-input')
    cInput.type = 'color'
    cInput.value = hex === 'transparent' ? '#ffffff' : hex
    var hInput = el('input', PREFIX + '-color-hex')
    hInput.type = 'text'
    hInput.value = hex

    cInput.addEventListener('input', function () {
      hInput.value = cInput.value
      applyStyle(ctrl.prop, cInput.value)
    })
    hInput.addEventListener('change', function () {
      var v = hInput.value.trim()
      if (/^#[0-9a-fA-F]{3,8}$/.test(v)) {
        cInput.value = v.length <= 5 ? v : v.slice(0, 7)
        applyStyle(ctrl.prop, v)
      } else if (v === 'transparent') {
        applyStyle(ctrl.prop, v)
      }
    })
    row.appendChild(cInput); row.appendChild(hInput)
    wrap.appendChild(row)
  }

  function buildSelect(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var val = ctrl.parse ? ctrl.parse(raw, state.selected) : raw
    var sel = el('select', PREFIX + '-select')
    ctrl.options.forEach(function (opt) {
      var o = el('option', null, { text: opt.label })
      o.value = opt.value
      if (opt.value === val) o.selected = true
      sel.appendChild(o)
    })
    sel.addEventListener('change', function () {
      applyStyle(ctrl.prop, ctrl.format ? ctrl.format(sel.value, state.selected) : sel.value)
    })
    wrap.appendChild(sel)
  }

  function buildBtnGroup(wrap, ctrl) {
    var val = cs(state.selected, ctrl.prop)
    var grp = el('div', PREFIX + '-btn-group')
    ctrl.options.forEach(function (opt) {
      var btn = el('button', PREFIX + '-bg-item' + (opt.value === val ? ' active' : ''), { text: opt.label })
      btn.addEventListener('click', function () {
        grp.querySelectorAll('.' + PREFIX + '-bg-item').forEach(function (b) { b.classList.remove('active') })
        btn.classList.add('active')
        applyStyle(ctrl.prop, opt.value)
      })
      grp.appendChild(btn)
    })
    wrap.appendChild(grp)
  }

  function buildSpacing(wrap, ctrl) {
    var sides = ['Top', 'Right', 'Bottom', 'Left']
    var labels = ['Top', 'Right', 'Bottom', 'Left']
    var grid = el('div', PREFIX + '-sp-grid')
    sides.forEach(function (side, i) {
      var col = el('div')
      col.appendChild(el('div', PREFIX + '-sp-label', { text: labels[i] }))
      var input = el('input', PREFIX + '-sp-input')
      input.type = 'number'; input.min = 0
      input.value = Math.round(parseFloat(cs(state.selected, ctrl.prop + side))) || 0
      input.addEventListener('change', function () {
        applyStyle(ctrl.prop + side, (parseInt(input.value) || 0) + 'px')
      })
      col.appendChild(input)
      grid.appendChild(col)
    })
    wrap.appendChild(grid)
  }

  function buildDimension(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var input = el('input', PREFIX + '-dim-input')
    input.type = 'text'
    input.value = raw
    input.placeholder = 'auto'
    input.addEventListener('change', function () {
      applyStyle(ctrl.prop, input.value || '')
    })
    wrap.appendChild(input)
  }

  function buildShadow(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var s = parseShadow(raw)
    var subs = [
      { key: 'x', label: 'X', min: -50, max: 50 },
      { key: 'y', label: 'Y', min: -50, max: 50 },
      { key: 'blur', label: 'Blur', min: 0, max: 50 }
    ]
    if (ctrl.hasSpread) subs.push({ key: 'spread', label: 'Spread', min: -20, max: 50 })

    function apply() { applyStyle(ctrl.prop, composeShadow(s, ctrl.hasSpread)) }

    subs.forEach(function (sc) {
      var row = el('div', PREFIX + '-ctrl-row')
      row.appendChild(el('span', PREFIX + '-shadow-label', { text: sc.label }))
      var slider = el('input', PREFIX + '-slider')
      slider.type = 'range'; slider.min = sc.min; slider.max = sc.max; slider.step = 1; slider.value = s[sc.key]
      var num = el('input', PREFIX + '-num')
      num.type = 'text'; num.value = Math.round(s[sc.key]) + 'px'
      slider.addEventListener('input', function () {
        s[sc.key] = parseFloat(slider.value); num.value = Math.round(s[sc.key]) + 'px'; apply()
      })
      num.addEventListener('change', function () {
        var v = parseFloat(num.value); if (!isNaN(v)) { s[sc.key] = v; slider.value = v; apply() }
      })
      row.appendChild(slider); row.appendChild(num)
      wrap.appendChild(row)
    })

    var colorRow = el('div', PREFIX + '-color-row')
    var cInput = el('input', PREFIX + '-color-input')
    cInput.type = 'color'; cInput.value = s.color === 'transparent' ? '#000000' : s.color
    var hInput = el('input', PREFIX + '-color-hex')
    hInput.type = 'text'; hInput.value = s.color
    cInput.addEventListener('input', function () { s.color = cInput.value; hInput.value = cInput.value; apply() })
    hInput.addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{3,8}$/.test(hInput.value.trim())) { s.color = hInput.value.trim(); cInput.value = s.color.slice(0, 7); apply() }
    })
    colorRow.appendChild(cInput); colorRow.appendChild(hInput)
    wrap.appendChild(colorRow)
  }

  function buildCompoundSlider(wrap, ctrl) {
    var inline = state.selected.style[ctrl.prop] || ''
    var fnVal = parseCSSFn(inline, ctrl.subFn)
    var val = fnVal !== null ? parseFloat(fnVal) : ctrl.defaultVal
    if (isNaN(val)) val = ctrl.defaultVal

    var row = el('div', PREFIX + '-ctrl-row')
    var slider = el('input', PREFIX + '-slider')
    slider.type = 'range'; slider.min = ctrl.min; slider.max = ctrl.max; slider.step = ctrl.step; slider.value = val
    var num = el('input', PREFIX + '-num')
    num.type = 'text'; num.value = round(val) + (ctrl.unit || '')

    function apply(v) {
      var cur = state.selected.style[ctrl.prop] || ''
      var valStr = ctrl.unit ? v + ctrl.unit : String(v)
      applyStyle(ctrl.prop, setCSSFn(cur, ctrl.subFn, valStr))
    }
    slider.addEventListener('input', function () {
      var v = parseFloat(slider.value); num.value = round(v) + (ctrl.unit || ''); apply(v)
    })
    num.addEventListener('change', function () {
      var v = parseFloat(num.value); if (!isNaN(v)) { slider.value = v; apply(v) }
    })
    row.appendChild(slider); row.appendChild(num)
    wrap.appendChild(row)
  }

  // ========== Style Application ==========

  function applyStyle(prop, value) {
    if (!state.selected) return
    pushHistory('style')
    state.selected.style[prop] = value
    updateSelOverlay()
  }

  function pushHistory(reason) {
    if (state.restoring) return
    state.history.push({ html: exportHTML(), reason: reason || 'change' })
    if (state.history.length > 30) state.history.shift()
    state.future = []
    updateToolbarState()
  }

  function restoreHTML(html) {
    state.restoring = true
    html = withEditorScript(html)
    document.open()
    document.write(html)
    document.close()
  }

  function getEditorSrc() {
    var script = document.querySelector('script[data-ve][src]') || document.querySelector('script[src*="editor.js"]')
    if (script && script.src) return script.src
    if (__ve_script_source) return 'editor.js'
    // ★ FIX: new URL throws under about: protocol, return relative path
    try { return new URL('editor.js', window.location.href).href }
    catch (e) { return 'editor.js' }
  }

  function withEditorScript(html) {
    var script
    if (__ve_script_source) {
      script = '<script data-ve="1">' + __ve_script_source.replace(/<\/script>/gi, '<\\/script>') + '<\/script>'
    } else {
      script = '<script src="' + getEditorSrc() + '" data-ve="1"><\/script>'
    }
    if (html.indexOf('</body>') !== -1) return html.replace('</body>', script + '</body>')
    if (html.indexOf('</html>') !== -1) return html.replace('</html>', script + '</html>')
    return html + script
  }

  function undo() {
    if (!state.history.length) {
      showToast('Nothing to undo')
      return
    }
    var item = state.history.pop()
    state.future.push({ html: exportHTML(), reason: 'redo' })
    if (state.future.length > 30) state.future.shift()
    try {
      sessionStorage.setItem(PREFIX + '-history', JSON.stringify(state.history))
      sessionStorage.setItem(PREFIX + '-future', JSON.stringify(state.future))
      sessionStorage.setItem(PREFIX + '-auto-edit', '1')
    } catch (e) {}
    restoreHTML(item.html)
  }

  function redo() {
    if (!state.future.length) {
      showToast('Nothing to redo')
      return
    }
    var item = state.future.pop()
    state.history.push({ html: exportHTML(), reason: 'undo' })
    if (state.history.length > 30) state.history.shift()
    try {
      sessionStorage.setItem(PREFIX + '-history', JSON.stringify(state.history))
      sessionStorage.setItem(PREFIX + '-future', JSON.stringify(state.future))
      sessionStorage.setItem(PREFIX + '-auto-edit', '1')
    } catch (e) {}
    restoreHTML(item.html)
  }

  function updateToolbarState() {
    if (dom.undoBtn) dom.undoBtn.disabled = state.history.length === 0
    if (dom.redoBtn) dom.redoBtn.disabled = state.future.length === 0
    if (dom.textBtn) dom.textBtn.disabled = !state.selected || !isTextEditable(state.selected)
    if (dom.layoutBtn) {
      dom.layoutBtn.classList.toggle('active', state.layoutOpen)
      dom.layoutBtn.disabled = false
    }
    if (dom.panel) dom.panel.classList.toggle('visible', !!(state.active && state.layoutOpen))
  }

  function toggleLayoutPanel() {
    if (!state.active) return
    state.layoutOpen = !state.layoutOpen
    updateToolbarState()
    if (state.layoutOpen) renderPanel()
  }

  function isTextEditable(target) {
    if (!target || isVE(target)) return false
    var tag = target.tagName ? target.tagName.toLowerCase() : ''
    return ['script', 'style', 'html', 'head', 'body', 'img', 'video', 'audio', 'canvas', 'svg', 'iframe'].indexOf(tag) === -1
  }

  function startTextEdit() {
    var target = state.selected
    if (!isTextEditable(target)) {
      showToast('This element cannot be edited directly')
      return
    }
    pushHistory('text')
    state.textEditing = target
    if (!target.hasAttribute('data-ve-prev-contenteditable')) {
      target.setAttribute('data-ve-prev-contenteditable', target.hasAttribute('contenteditable') ? target.getAttribute('contenteditable') : '__ve_absent')
    }
    target.setAttribute('contenteditable', 'true')
    target.setAttribute('data-ve-editing', '1')
    target.focus()
    hideOv(dom.hoverOv)
    updateSelOverlay()
    showToast('Editing text · Click blank area or press Esc to finish')
  }

  function finishTextEdit() {
    var target = state.textEditing
    if (!target) return
    restoreContenteditable(target)
    target.removeAttribute('data-ve-editing')
    target.removeAttribute('data-ve-prev-contenteditable')
    state.textEditing = null
    if (state.selected === target) updateSelOverlay()
    showToast('Text updated')
  }

  function restoreContenteditable(el) {
    if (!el || !el.hasAttribute('data-ve-prev-contenteditable')) {
      if (el) el.removeAttribute('contenteditable')
      return
    }
    var prev = el.getAttribute('data-ve-prev-contenteditable')
    if (prev === '__ve_absent') el.removeAttribute('contenteditable')
    else el.setAttribute('contenteditable', prev)
  }

  function reloadPage() {
    if (confirm('Reload will discard unsaved changes. Continue?')) {
      try { window.parent.postMessage({type:'__ve-reload'},'*') } catch(e) { window.location.reload() }
    }
  }

  // ========== Page Navigation ==========

  function isVisiblePageCandidate(el) {
    if (!el || isVE(el)) return false
    var r = el.getBoundingClientRect()
    var style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    return r.width >= window.innerWidth * 0.45 && r.height >= window.innerHeight * 0.45
  }

  function isExplicitPageNode(el) {
    if (!el || isVE(el)) return false
    var tag = el.tagName ? el.tagName.toLowerCase() : ''
    var id = (el.id || '').toLowerCase()
    var cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''
    var role = (el.getAttribute && (el.getAttribute('role') || '').toLowerCase()) || ''
    var aria = (el.getAttribute && (el.getAttribute('aria-label') || '').toLowerCase()) || ''
    return el.hasAttribute && (
      el.hasAttribute('data-page') ||
      el.hasAttribute('data-page-number') ||
      el.hasAttribute('data-page-no') ||
      el.hasAttribute('data-slide') ||
      el.hasAttribute('data-slide-index') ||
      el.hasAttribute('data-slide-number') ||
      /\b(page|slide|ppt|deck-page|presentation-page)\b/.test(cls) ||
      /(^|[-_])(page|slide|ppt)([-_]|$|\d)/.test(cls) ||
      /(^|[-_])(page|slide|ppt)([-_]|$|\d)/.test(id) ||
      tag === 'section' ||
      role === 'document' ||
      role === 'group' && /page|slide/.test(aria)
    )
  }

  function isScrollableCandidate(el) {
    if (!el || isVE(el) || el === document.body || el === document.documentElement) return false
    var r = el.getBoundingClientRect()
    if (r.width < 180 || r.height < 180) return false
    var style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    var overflowY = style.overflowY
    var overflowX = style.overflowX
    var canScrollY = el.scrollHeight > el.clientHeight + 40 && overflowY !== 'hidden'
    var canScrollX = el.scrollWidth > el.clientWidth + 40 && overflowX !== 'hidden'
    return canScrollY || canScrollX
  }

  function findScrollTarget() {
    var best = null
    var bestArea = 0
    var nodes = document.querySelectorAll('body *')
    each(nodes, function (node) {
      if (!isScrollableCandidate(node)) return
      var r = node.getBoundingClientRect()
      var area = r.width * r.height
      if (area > bestArea) {
        best = node
        bestArea = area
      }
    })
    return best
  }

  function uniqueByPosition(items) {
    var out = []
    items.sort(function (a, b) { return (a.y || 0) - (b.y || 0) || a.x - b.x })
    items.forEach(function (item) {
      var prev = out[out.length - 1]
      if (!prev || Math.abs(prev.x - item.x) > 80 || Math.abs((prev.y || 0) - (item.y || 0)) > 80) out.push(item)
    })
    return out
  }

  function pagePos(node) {
    var r = node.getBoundingClientRect()
    var scroller = closestScroller(node)
    var sr = scroller ? scroller.getBoundingClientRect() : null
    return {
      node: node,
      scroller: scroller,
      x: scroller ? r.left - sr.left + scroller.scrollLeft : r.left + window.pageXOffset,
      y: scroller ? r.top - sr.top + scroller.scrollTop : r.top + window.pageYOffset,
      explicitIndex: parsePageIndex(node)
    }
  }

  function parsePageIndex(node) {
    var raw = node.getAttribute('data-i') || node.getAttribute('data-index') ||
      node.getAttribute('data-page') || node.getAttribute('data-page-number') ||
      node.getAttribute('data-slide') || node.getAttribute('data-slide-index') ||
      node.getAttribute('data-slide-number')
    var n = parseInt(raw, 10)
    return isNaN(n) ? null : n
  }

  function markStackedPages(pages) {
    if (pages.length < 2) return pages
    var first = pages[0]
    var visuallyStacked = pages.every(function (page) {
      return Math.abs(page.x - first.x) < 8 && Math.abs((page.y || 0) - (first.y || 0)) < 8
    })
    var firstNode = first.node
    var firstStyle = firstNode && getComputedStyle(firstNode)
    var layoutStacked = firstNode && /^(absolute|fixed)$/.test(firstStyle.position) && pages.every(function (page) {
      var node = page.node
      if (!node || node.parentElement !== firstNode.parentElement) return false
      var style = getComputedStyle(node)
      return /^(absolute|fixed)$/.test(style.position) &&
        node.offsetParent === firstNode.offsetParent &&
        Math.abs(node.offsetLeft - firstNode.offsetLeft) < 8 &&
        Math.abs(node.offsetTop - firstNode.offsetTop) < 8
    })
    if (visuallyStacked || layoutStacked) pages.forEach(function (page) { page.stacked = true })
    return pages
  }

  function setPageMode(mode, pages) {
    state.pageMode = mode
    pages.forEach(function (page) { page.mode = mode })
    return pages
  }

  function closestScroller(node) {
    var cur = node.parentElement
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (isScrollableCandidate(cur)) return cur
      cur = cur.parentElement
    }
    return null
  }

  function collectExplicitPageNodes() {
    var selectors = [
      '[data-page]', '[data-page-number]', '[data-page-no]',
      '[data-slide]', '[data-slide-index]', '[data-slide-number]',
      '[id*="page"]', '[id*="Page"]', '[id*="slide"]', '[id*="Slide"]', '[id*="ppt"]',
      '[class*="page"]', '[class*="Page"]', '[class*="slide"]', '[class*="Slide"]', '[class*="ppt"]',
      'section'
    ].join(',')

    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors))
      .filter(function (node) { return isExplicitPageNode(node) && isVisiblePageCandidate(node) })

    return nodes.filter(function (node) {
      return !nodes.some(function (other) { return other !== node && node.contains(other) && isVisiblePageCandidate(other) })
    })
  }

  function sortPages(pages) {
    pages.sort(function (a, b) {
      if (a.explicitIndex !== null && b.explicitIndex !== null) return a.explicitIndex - b.explicitIndex
      return (a.y || 0) - (b.y || 0) || a.x - b.x
    })
    return pages
  }

  function detectSlidePages() {
    var pages = markStackedPages(sortPages(collectExplicitPageNodes().map(pagePos)))
    if (pages.length > 1 && pages.every(function (page) { return page.stacked })) return setPageMode('slide', pages)
    return []
  }

  function detectExplicitPages() {
    var pages = sortPages(collectExplicitPageNodes().map(pagePos))
    if (pages.length > 1) return setPageMode('element', pages)
    return pages
  }

  function sizeKey(item) {
    var w = Math.round(item.rect.width / 40) * 40
    var h = Math.round(item.rect.height / 40) * 40
    return w + 'x' + h
  }

  function collectRepeatedCandidates(rootNode, viewportWidth, viewportHeight) {
    var nodes = Array.prototype.slice.call(rootNode.querySelectorAll ? rootNode.querySelectorAll('*') : [])
    return nodes.filter(function (node) {
      if (isVE(node)) return false
      var r = node.getBoundingClientRect()
      var style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return false
      if (r.width < Math.max(140, viewportWidth * 0.22)) return false
      if (r.height < Math.max(100, viewportHeight * 0.12)) return false
      if (r.width * r.height < viewportWidth * viewportHeight * 0.08) return false
      return true
    }).map(function (node) {
      var r = node.getBoundingClientRect()
      return { node: node, rect: r, key: null }
    })
  }

  function removeAncestorCandidates(items) {
    return items.filter(function (item) {
      return !items.some(function (other) {
        return other !== item && item.node.contains(other.node) &&
          other.rect.width >= item.rect.width * 0.55 &&
          other.rect.height >= item.rect.height * 0.55
      })
    })
  }

  function detectRepeatedPages() {
    var scrollTarget = findScrollTarget()
    var contexts = []
    if (scrollTarget) contexts.push(scrollTarget)
    contexts.push(document.body)

    var best = []
    contexts.forEach(function (ctx) {
      var viewportWidth = ctx === document.body ? window.innerWidth : ctx.clientWidth
      var viewportHeight = ctx === document.body ? window.innerHeight : ctx.clientHeight
      var candidates = removeAncestorCandidates(collectRepeatedCandidates(ctx, viewportWidth, viewportHeight))
      var groups = {}
      candidates.forEach(function (item) {
        var key = sizeKey(item)
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      })
      Object.keys(groups).forEach(function (key) {
        var group = groups[key]
        if (group.length < 3) return
        group.sort(function (a, b) {
          return a.rect.top - b.rect.top || a.rect.left - b.rect.left
        })
        if (group.length > best.length) best = group
      })
    })

    // ★ FIX: filter false positives
    // Core rule: if all elements in group are in normal flow (not absolute/fixed),
    // it is definitely not slide-style multi-page, discard (layout containers like .section/.card are falsely detected).
    if (best.length > 0) {
      var hasAbsolute = best.some(function (item) {
        if (!item.node) return false
        try {
          var pos = (getComputedStyle(item.node).position || '').toLowerCase()
          return pos === 'absolute' || pos === 'fixed'
        } catch(e) {
          var s = (item.node.style.position || '').toLowerCase()
          return s === 'absolute' || s === 'fixed'
        }
      })
      // ★ KEY: no absolute/fixed elements → false positive, discard
      if (!hasAbsolute) {
        return []
      }
    }

    return setPageMode('element', uniqueByPosition(best.map(function (item) { return pagePos(item.node) })))
  }

  function parsePageCounterText(text) {
    var m = String(text || '').match(/(\d+)\s*[\/／]\s*(\d+)/)
    if (!m) return null
    var current = parseInt(m[1], 10)
    var total = parseInt(m[2], 10)
    if (!current || !total || total < 2 || current > total || total > 500) return null
    return { current: current, total: total }
  }

  function detectRuntimePages() {
    var selectors = [
      '.page-num', '.pageNum', '#pageNum',
      '.pg', '#pg', '.pager', '#pager',
      '[class*="page"]', '[id*="page"]',
      '[class*="Page"]', '[id*="Page"]'
    ].join(',')
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors))
    var counter = null
    var parsed = null
    nodes.some(function (node) {
      if (isVE(node)) return false
      var text = (node.textContent || '').trim()
      if (text.length > 40) return false
      parsed = parsePageCounterText(text)
      if (!parsed) return false
      var style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return false
      counter = node
      return true
    })
    if (!counter || !parsed) return []
    var pages = []
    for (var i = 0; i < parsed.total; i++) pages.push({ node: null, counter: counter, x: 0, y: 0 })
    return setPageMode('runtime', pages)
  }

  function detectPages() {
    var pages = detectSlidePages()
    if (pages.length > 1) return pages

    pages = detectExplicitPages()
    if (pages.length > 1) return pages

    pages = detectRepeatedPages()
    if (pages.length > 1) return pages

    pages = detectRuntimePages()
    if (pages.length > 1) return pages

    // ★ FIX: all page detection failed → single page document, return single page
    // No longer use scroll pixel splitting, avoid false multi-page detection
    return setPageMode('scroll', [{ node: null, scroller: null, x: 0, y: 0 }])
  }

  function refreshPages() {
    state.pages = detectPages()
    updateCurrentPage()
    updatePagerState()
    // ★ Notify parent page of page count change
    try {
      window.parent.postMessage({
        type: '__ve-pages',
        pageMode: state.pageMode,
        pagesLength: state.pages.length,
        currentPage: state.currentPage
      }, '*')
    } catch(e) {}
  }

  function updateCurrentPage() {
    if (!state.pages.length) {
      state.currentPage = 0
      return
    }
    if (state.pageMode === 'slide') {
      for (var i = 0; i < state.pages.length; i++) {
        var node = state.pages[i].node
        if (node && node.classList && node.classList.contains('active')) {
          state.currentPage = i
          return
        }
      }
    }
    if (state.pageMode === 'runtime') {
      var counter = state.pages[0] && state.pages[0].counter
      var parsed = counter ? parsePageCounterText(counter.textContent) : null
      if (parsed) {
        state.currentPage = parsed.current - 1
        return
      }
    }
    var first = state.pages[0]
    var curX = first && first.scroller ? first.scroller.scrollLeft : window.pageXOffset
    var curY = first && first.scroller ? first.scroller.scrollTop : window.pageYOffset
    var best = 0
    var bestDist = Infinity
    state.pages.forEach(function (page, i) {
      var dist = Math.abs(page.x - curX) + Math.abs((page.y || 0) - curY)
      if (dist < bestDist) { best = i; bestDist = dist }
    })
    state.currentPage = best
  }

  function updatePagerState() {
    if (!dom.pageLabel) return
    var total = Math.max(1, state.pages.length)
    var usable = hasUsablePager()
    if (dom.pager) {
      dom.pager.classList.toggle('hidden', !usable)
      dom.pager.setAttribute('aria-hidden', usable ? 'false' : 'true')
    }
    if (!usable) {
      dom.pageLabel.textContent = ''
      if (dom.prevPageBtn) dom.prevPageBtn.disabled = true
      if (dom.nextPageBtn) dom.nextPageBtn.disabled = true
      return
    }
    dom.pageLabel.textContent = (state.currentPage + 1) + '/' + total
    if (dom.prevPageBtn) dom.prevPageBtn.disabled = total <= 1 || state.currentPage <= 0
    if (dom.nextPageBtn) dom.nextPageBtn.disabled = total <= 1 || state.currentPage >= total - 1
  }

  function hasUsablePager() {
    return state.pages.length > 1 && /^(slide|element|runtime|scroll)$/.test(state.pageMode)
  }

  function goPage(delta) {
    if (state.textEditing) finishTextEdit()
    refreshPages()
    if (!hasUsablePager()) return
    var total = state.pages.length
    if (!total) return
    var next = Math.max(0, Math.min(total - 1, state.currentPage + delta))
    if (next === state.currentPage) return
    deselectElement()
    var page = state.pages[next]
    if (state.pageMode === 'runtime') {
      activateRuntimePage(delta)
    } else if (state.pageMode === 'slide' && page.node) {
      activateStackedPage(next)
    } else if (page.node) {
      page.node.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' })
    } else if (page.scroller) {
      page.scroller.scrollTo({ left: page.x, top: page.y || 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ left: page.x, top: page.y || 0, behavior: 'smooth' })
    }
    state.currentPage = next
    updatePagerState()
    setTimeout(function () { updateCurrentPage(); updatePagerState(); onScrollResize() }, 350)
  }

  function activateRuntimePage(delta) {
    var key = delta > 0 ? 'ArrowRight' : 'ArrowLeft'
    var event = new KeyboardEvent('keydown', {
      key: key,
      code: key,
      bubbles: true,
      cancelable: true
    })
    document.dispatchEvent(event)
  }

  function activateStackedPage(index) {
    if (typeof window.goTo === 'function') {
      try { window.goTo(index) } catch (e) {}
    }

    if (getActiveStackedPageIndex() !== index) manuallyActivateStackedPage(index)
    syncStackedPageChrome(index)
  }

  function getActiveStackedPageIndex() {
    for (var i = 0; i < state.pages.length; i++) {
      var node = state.pages[i].node
      if (node && node.classList && node.classList.contains('active')) return i
    }
    return -1
  }

  function manuallyActivateStackedPage(index) {
    state.pages.forEach(function (page, i) {
      var node = page.node
      if (!node || !node.classList) return
      if (i === index) {
        node.classList.add('active')
        node.classList.remove('prev')
      } else if (i < index) {
        node.classList.remove('active')
        node.classList.add('prev')
      } else {
        node.classList.remove('active')
        node.classList.remove('prev')
      }
    })
  }

  function syncStackedPageChrome(index) {
    var total = state.pages.length
    var prev = document.getElementById('prevBtn')
    var next = document.getElementById('nextBtn')
    var pageNum = document.getElementById('pageNum')
    if (prev) prev.disabled = index === 0
    if (next) next.disabled = index === total - 1
    if (pageNum) pageNum.textContent = (index + 1) + ' / ' + total
    each(document.querySelectorAll('.dot'), function (dot, i) {
      if (i === index) dot.classList.add('active')
      else dot.classList.remove('active')
    })
  }

  // ========== Overlay Positioning ==========

  function positionOv(ov, target) {
    var r = target.getBoundingClientRect()
    ov.style.display = 'block'
    ov.style.top = r.top + 'px'; ov.style.left = r.left + 'px'
    ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px'
    var tag = ov.querySelector('.' + PREFIX + '-ov-tag')
    if (tag) {
      var label = target.tagName.toLowerCase()
      if (target.className && typeof target.className === 'string') {
        var c = target.className.split(/\s+/).filter(function (s) { return s && !hasPrefix(s, PREFIX) })[0]
        if (c) label += '.' + c
      }
      tag.textContent = label
    }
  }

  function hideOv(ov) { ov.style.display = 'none' }
  function updateSelOverlay() { if (state.selected) positionOv(dom.selOv, state.selected) }

  // ========== Element Selection ==========

  function onMouseMove(e) {
    if (!state.active) return
    if (state.textEditing) return
    var t = e.target
    if (isVE(t)) { hideOv(dom.hoverOv); state.hovered = null; return }
    if (t === state.hovered) return
    state.hovered = t
    positionOv(dom.hoverOv, t)
  }

  function onMouseDown(e) {
    if (!state.active) return
    if (isVE(e.target)) return
    if (state.textEditing && (e.target === state.textEditing || state.textEditing.contains(e.target))) return
    if (e.ctrlKey || e.altKey) return // Ctrl/Alt+click passes through to page
    e.preventDefault(); e.stopPropagation()
    selectElement(e.target)
  }

  function onClickCapture(e) {
    if (state.textEditing && (e.target === state.textEditing || state.textEditing.contains(e.target))) return
    if (state.active && !isVE(e.target) && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopPropagation() }
  }

  function selectElement(target) {
    if (state.textEditing && target !== state.textEditing && !state.textEditing.contains(target)) finishTextEdit()
    state.selected = target
    positionOv(dom.selOv, target)
    hideOv(dom.hoverOv)
    dom.breadcrumb.textContent = elPath(target)
    updateToolbarState()
    if (state.layoutOpen) renderPanel()
  }

  function deselectElement() {
    state.selected = null
    hideOv(dom.selOv)
    dom.breadcrumb.textContent = ''
    updateToolbarState()
    if (state.layoutOpen) renderPanel()
  }

  function onScrollResize() {
    if (state.hovered && dom.hoverOv.style.display !== 'none') positionOv(dom.hoverOv, state.hovered)
    if (state.selected && dom.selOv.style.display !== 'none') positionOv(dom.selOv, state.selected)
    if (state.active) { updateCurrentPage(); updatePagerState() }
  }

  // ========== Edit Mode ==========

  function toggleEdit() { if (state.active) exitEdit(); else enterEdit() }

  function enterEdit() {
    state.active = true
    dom.toggle.classList.add('active')
    dom.toggle.innerHTML = ICON_X
    dom.toggle.title = 'Exit edit mode (Alt+E)'
    dom.toolbar.classList.add('visible')
    state.layoutOpen = false
    refreshPages()
    updateToolbarState()
    showToast('Click to select · Hold Ctrl+click for original behavior', 3000)
    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('click', onClickCapture, true)
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
  }

  function exitEdit() {
    finishTextEdit()
    state.active = false; state.selected = null; state.hovered = null
    dom.toggle.classList.remove('active')
    dom.toggle.innerHTML = ICON_EDIT
    dom.toggle.title = '切换编辑模式 (Alt+E)'
    dom.toolbar.classList.remove('visible')
    dom.panel.classList.remove('visible')
    state.layoutOpen = false
    hideOv(dom.hoverOv); hideOv(dom.selOv)
    dom.breadcrumb.textContent = ''
    updateToolbarState()
    document.removeEventListener('mousemove', onMouseMove, true)
    document.removeEventListener('mousedown', onMouseDown, true)
    document.removeEventListener('click', onClickCapture, true)
    window.removeEventListener('scroll', onScrollResize, true)
    window.removeEventListener('resize', onScrollResize)
  }

  // ========== Export ==========

  function exportHTML() {
    finishTextEdit()
    var clone = document.documentElement.cloneNode(true)
    cleanEditorArtifacts(clone)
    return '<!DOCTYPE html>\n' + clone.outerHTML
  }

  function cleanEditorArtifacts(root) {
    var editorSrc = getEditorSrc()
    var rootEl = root.querySelector('#' + PREFIX + '-root')
    if (rootEl) rootEl.remove()
    each(root.querySelectorAll('.' + PREFIX + '-toggle'), removeNode)
    each(root.querySelectorAll('style[data-ve], script[data-ve]'), removeNode)
    each(root.querySelectorAll('script[src]'), function (script) {
      if (isEditorScript(script.getAttribute('src'), editorSrc)) removeNode(script)
    })
    each(root.querySelectorAll('[data-ve-editing], [data-ve-prev-contenteditable]'), function (el) {
      restoreContenteditable(el)
      el.removeAttribute('data-ve-editing')
      el.removeAttribute('data-ve-prev-contenteditable')
    })
  }

  function isEditorScript(src, editorSrc) {
    if (!src) return false
    if (editorSrc === 'editor.js') return /(^|\/)editor\.js(?:[?#].*)?$/i.test(src)
    // ★ FIX: new URL throws under about: protocol, use string match
    try {
      var absolute = new URL(src, window.location.href).href
      return absolute === editorSrc || /(^|\/)editor\.js(?:[?#].*)?$/i.test(absolute)
    } catch (e) {
      // URL parsing failed (about:srcdoc etc.), fall back to string match
      return src === editorSrc || /(^|\/)editor\.js(?:[?#].*)?$/i.test(src)
    }
  }

  function copyHTML() {
    var html = exportHTML()
    try { window.parent.postMessage({type:'__ve-copy',html:html},'*'); showToast('Copied to clipboard'); return } catch(e) {}
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(
        function () { showToast('Copied to clipboard') },
        function () { fallbackCopy(html) }
      )
    } else { fallbackCopy(html) }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea')
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
    ta.setAttribute('readonly', '')
    document.body.appendChild(ta); ta.select()
    if (ta.setSelectionRange) ta.setSelectionRange(0, ta.value.length)
    try { document.execCommand('copy'); showToast('Copied to clipboard') }
    catch (e) { showToast('Copy failed, please export HTML manually') }
    removeNode(ta)
  }

  function downloadHTML() {
    var html = exportHTML()
    try { window.parent.postMessage({type:'__ve-download',html:html,filename:'page-' + Date.now() + '.html'},'*'); showToast('Downloaded'); return } catch(e) {}
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, 'page-' + Date.now() + '.html')
      showToast('Downloaded')
      return
    }
    if (!window.URL || !URL.createObjectURL) {
      showToast('Browser does not support download, please copy HTML')
      return
    }
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a'); a.href = url
    a.download = 'page-' + Date.now() + '.html'
    a.setAttribute('data-ve-ui', '1')
    a.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0'
    document.body.appendChild(a)
    try {
      if ('download' in a) {
        a.click()
      } else {
        window.open(url, '_blank')
      }
    } catch (e) {
      window.location.href = url
    }
    setTimeout(function () {
      removeNode(a)
      URL.revokeObjectURL(url)
    }, 1000)
    showToast('Downloaded')
  }

  // ========== Keyboard ==========

  function onKeyDown(e) {
    if (e.altKey && e.key.toLowerCase() === 'e') { e.preventDefault(); toggleEdit(); return }
    if (!state.active) return
    if (e.key === 'Escape') { e.preventDefault(); state.textEditing ? finishTextEdit() : (state.selected ? deselectElement() : exitEdit()); return }
    if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); startTextEdit(); return }
    if (e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return }
    if (e.altKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return }
    if (e.altKey && e.key === 'ArrowLeft' && hasUsablePager()) { e.preventDefault(); goPage(-1); return }
    if (e.altKey && e.key === 'ArrowRight' && hasUsablePager()) { e.preventDefault(); goPage(1); return }
    if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copyHTML(); return }
    if (e.altKey && e.key.toLowerCase() === 's') { e.preventDefault(); downloadHTML(); return }
  }

  // ========== Init ==========

  // ★ DEBUG: record init() steps to global array for cloak
  window.__ve_logs = window.__ve_logs || []

  function init() {
    window.__ve_logs.push('init() step 1: injectCSS')
    try { injectCSS() } catch(e) { window.__ve_logs.push('injectCSS ERROR: ' + e.message) }
    window.__ve_logs.push('init() step 2: createUI')
    try { createUI() } catch(e) { window.__ve_logs.push('createUI ERROR: ' + e.message) }
    window.__ve_logs.push('init() step 3: sessionStorage')
    try {
      var savedHistory = sessionStorage.getItem(PREFIX + '-history')
      if (savedHistory) state.history = JSON.parse(savedHistory) || []
      var savedFuture = sessionStorage.getItem(PREFIX + '-future')
      if (savedFuture) state.future = JSON.parse(savedFuture) || []
      sessionStorage.removeItem(PREFIX + '-history')
      sessionStorage.removeItem(PREFIX + '-future')
      if (sessionStorage.getItem(PREFIX + '-auto-edit') === '1') {
        sessionStorage.removeItem(PREFIX + '-auto-edit')
        setTimeout(enterEdit, 80)
      }
    } catch (e) { window.__ve_logs.push('sessionStorage ERROR: ' + e.message) }
    window.__ve_logs.push('init() step 4: updateToolbarState')
    try { updateToolbarState() } catch(e) { window.__ve_logs.push('updateToolbarState ERROR: ' + e.message) }
    window.__ve_logs.push('init() step 5: addEventListener')
    try { document.addEventListener('keydown', onKeyDown) } catch(e) { window.__ve_logs.push('addEventListener ERROR: ' + e.message) }
    window.__ve_logs.push('init() step 6: set __ve_state')
    // ★ FIX: expose state to window for parent page/test access
    try {
      window.__ve_state = state
      window.__ve_logs.push('__ve_state set: pages=' + state.pages.length + ', mode=' + state.pageMode)
    } catch(e) { window.__ve_logs.push('set __ve_state ERROR: ' + e.message) }
    window.__ve_init_done = true
    window.__ve_logs.push('init() COMPLETE')
  }

  window.__ve_logs.push('IIFE: about to call init()')
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
    window.__ve_logs.push('init() deferred to DOMContentLoaded')
  } else {
    init()
    window.__ve_logs.push('init() called immediately')
  }
  window.__ve_logs.push('IIFE end: about to close IIFE')
  } catch (e) {
    window.__ve_ife_error = e.message + ' | stack: ' + (e.stack || 'no stack')
  }
})()
