var useState = (typeof React !== 'undefined' && React.useState) ? React.useState : function(v) { return [v, function() {}]; };
var useMemo = (typeof React !== 'undefined' && React.useMemo) ? React.useMemo : function(fn) { return fn(); };
var useEffect = (typeof React !== 'undefined' && React.useEffect) ? React.useEffect : function() {};
var useCallback = (typeof React !== 'undefined' && React.useCallback) ? React.useCallback : function(fn) { return fn; };
var useRef = (typeof React !== 'undefined' && React.useRef) ? React.useRef : function(v) { return { current: v }; };
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(r) { for (var t = 1; t < arguments.length; t++) { var o = null != arguments[t] ? arguments[t] : {}; t % 2 ? ownKeys(Object(o), !0).forEach(function (t) { _defineProperty(r, t, o[t]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(o)) : ownKeys(Object(o)).forEach(function (e) { Object.defineProperty(r, e, Object.getOwnPropertyDescriptor(o, e)); }); } return r; }
function _defineProperty(r, t, o) { return (t = _toPropertyKey(t)) in r ? Object.defineProperty(r, t, { value: o, enumerable: !0, configurable: !0, writable: !0 }) : r[t] = o, r; }
function _toPropertyKey(r) { var o = _toPrimitive(r, "string"); return "symbol" == _typeof(o) ? o : o + ""; }
function _toPrimitive(t, e) { if ("object" != _typeof(t) || !t) return t; var r; if ("undefined" != typeof Symbol && void 0 !== (r = t[Symbol.toPrimitive])) { var i = r.call(t, e || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === e ? String : Number)(t); }
function _createForOfIteratorHelper(e, t) { var _n = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"]; if (!_n) { if (Array.isArray(e) || (_n = _unsupportedIterableToArray(e)) || t && e && "number" == typeof e.length) { _n && (e = _n); var o = 0, F = function F() {}; return { s: F, n: function n() { return o >= e.length ? { done: !0 } : { done: !1, value: e[o++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var a, u, i = !0; return { s: function s() { _n = _n.call(e); }, n: function n() { i = !0; var r = _n.next(); return r.done ? { done: !0 } : { value: r.value, done: i = !1 }; }, e: function e(r) { a = !0, u = r; }, f: function f() { try { i || null == _n["return"] || _n["return"](); } finally { if (a) throw u; } } }; }
function _toConsumableArray(a) { return _arrayWithoutHoles(a) || _iterableToArray(a) || _unsupportedIterableToArray(a) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { var e = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (Array.isArray(r) && (null == e || e === ("undefined" != typeof Symbol && [][Symbol.iterator]) || e === []["@@iterator"])) return r; if (null != e) { for (var t, o = [], a = e.call(r); !(t = a.next()).done;) o.push(t.value); return o; } }
function _arrayWithoutHoles(a) { if (Array.isArray(a)) return _arrayLikeToArray(a); }
function _slicedToArray(e, i) { return _iterableToArrayLimit(e, i) || _unsupportedIterableToArray(e, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(t, e) { if (t) { if ("string" == typeof t) return _arrayLikeToArray(t, e); var o = {}.toString.call(t).slice(8, -1); return "Object" === o && t.constructor && (o = t.constructor.name), "Map" === o || "Set" === o ? Array.from(t) : "Arguments" === o || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o) ? _arrayLikeToArray(t, e) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, t) { var e = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (Array.isArray(r) && (null == e || e === ("undefined" != typeof Symbol && [][Symbol.iterator]) || e === []["@@iterator"])) return r; if (null != e) { var l, n, i, a, u = [], o = !0, f = !1; try { if (i = (e = e.call(r)).next, 0 === t) { if (Object(e) !== e) return; o = !1; } else for (; !(o = (l = i.call(e)).done) && (u.push(l.value), u.length !== t); o = !0); } catch (r) { f = !0, n = r; } finally { try { if (!o && null != e["return"] && (a = e["return"](), Object(a) !== a)) return; } finally { if (f) throw n; } } return u; } }
var _React = React,
  useState = _React.useState,
  useMemo = _React.useMemo,
  useEffect = _React.useEffect;

// --- Lucide Outline SVG Icons ---
var Icon = function Icon(_ref) {
  var name = _ref.name,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? "w-4 h-4" : _ref$className,
    _ref$strokeWidth = _ref.strokeWidth,
    strokeWidth = _ref$strokeWidth === void 0 ? 1.5 : _ref$strokeWidth;
  var icons = {
    bolt: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M13 10V3L4 14h7v7l9-11h-7z"
    }),
    search: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    }),
    mapPin: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    }),
    bell: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    }),
    chevronDown: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M19.5 8.25l-7.5 7.5-7.5-7.5"
    }),
    crown: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3.75 6.75l3.75 10.5h9l3.75-10.5-6 4.5-4.5-4.5-6 4.5z"
    }),
    layoutDashboard: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    }),
    calendar: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    }),
    calendarDays: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
    }),
    bookmark: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
    }),
    clock: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    }),
    creditCard: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6.75-9.75h19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H2.25a2.25 2.25 0 01-2.25-2.25V8.25a2.25 2.25 0 012.25-2.25z"
    }),
    barChart: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    }),
    building: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
    }),
    users: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    }),
    database: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
    }),
    settings: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    }),
    sliders: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
    }),
    heart: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    }),
    heartFilled: /*#__PURE__*/React.createElement("path", {
      fill: "currentColor",
      stroke: "none",
      d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    }),
    monitor: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
    }),
    video: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
    }),
    mic: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
    }),
    wifi: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
    }),
    projector: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 19.5zm11.25-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
    }),
    edit3: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
    }),
    sun: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
    }),
    coffee: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    }),
    accessibility: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    }),
    repeat: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    }),
    userPlus: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-1.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
    }),
    fileText: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    }),
    moreHorizontal: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
    }),
    check: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M4.5 12.75l6 6 9-13.5"
    }),
    x: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M6 18L18 6M6 6l12 12"
    }),
    externalLink: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    }),
    chevronRight: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M8.25 4.5l7.5 7.5-7.5 7.5"
    }),
    arrowRight: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
    }),
    trendingUp: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M2.25 18L9 11.25l4.5 4.5 7.5-7.5M21 8.25V12m0-3.75h-3.75"
    }),
    coins: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }),
    gift: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V21m0-16.125A2.625 2.625 0 1114.625 7.5H12m-9 3.75h18"
    }),
    sparkles: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    }),
    checkCircle: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }),
    xCircle: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }),
    alertCircle: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    }),
    calendarCheck: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-8.25-3.75l2.25 2.25 4.5-4.5"
    }),
    filter: /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
    })
  };
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: strokeWidth,
    stroke: "currentColor",
    className: className
  }, icons[name] || icons.bolt);
};

// --- Mock Data ---
var INITIAL_ROOMS = [{
  id: "mr-1",
  name: "Boardroom Alpha",
  capacity: 10,
  type: "Boardroom",
  status: "Available",
  image: "assets/rooms/mr-01-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
  amenities: ["Projector", "Video Conferencing", "Whiteboard", "TV/Display", "Audio/Mic"],
  rate: "₹2,500/hr"
}, {
  id: "mr-2",
  name: "Pitch Arena Nexus",
  capacity: 8,
  type: "Pitch Room",
  status: "Available",
  image: "assets/rooms/mr-02-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  amenities: ["TV/Display", "Video Conferencing", "Audio/Mic", "Natural Light"],
  rate: "₹3,000/hr"
}, {
  id: "mr-3",
  name: "Focus Room",
  capacity: 4,
  type: "Meeting Room",
  status: "In Use",
  image: "assets/rooms/mr-03-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
  amenities: ["TV/Display", "Whiteboard", "Audio/Mic"],
  rate: "₹1,200/hr"
}, {
  id: "mr-4",
  name: "Collaboration Room",
  capacity: 6,
  type: "Meeting Room",
  status: "Available",
  image: "assets/rooms/mr-04-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
  amenities: ["Whiteboard", "Video Conferencing", "Natural Light"],
  rate: "₹1,800/hr"
}, {
  id: "mr-5",
  name: "Training Room",
  capacity: 20,
  type: "Training Room",
  status: "Available",
  image: "assets/rooms/mr-05-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
  amenities: ["Projector", "Audio/Mic", "Whiteboard", "Catering", "Accessible"],
  rate: "₹4,000/hr"
}, {
  id: "mr-6",
  name: "Creative Studio",
  capacity: 8,
  type: "Event Space",
  status: "Available",
  image: "assets/rooms/mr-06-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  amenities: ["TV/Display", "Whiteboard", "Natural Light", "Audio/Mic"],
  rate: "₹2,200/hr"
}];
var ROOM_TYPES = ["All Rooms", "Meeting Room", "Conference Room", "Training Room", "Pitch Room", "Boardroom", "Event Space"];
var AMENITIES_LIST = [{
  name: "Projector",
  icon: "projector"
}, {
  name: "Video Conferencing",
  icon: "video"
}, {
  name: "Whiteboard",
  icon: "edit3"
}, {
  name: "TV/Display",
  icon: "monitor"
}, {
  name: "Audio/Mic",
  icon: "mic"
}, {
  name: "Catering",
  icon: "coffee"
}, {
  name: "Accessible",
  icon: "accessibility"
}, {
  name: "Natural Light",
  icon: "sun"
}];

// --- Main App Component ---
function MeetingRoomsApp() {
  // States
  var _useState = useState(function () {
      try {
        var hash = window.location.hash.replace("#", "").toLowerCase().replace(/[-_]/g, "");
        var urlParams = new URLSearchParams(window.location.search);
        var tabParam = (urlParams.get("tab") || urlParams.get("view") || "").toLowerCase().replace(/[-_]/g, "");
        var pathname = window.location.pathname.toLowerCase();
        if (hash === "billing" || hash === "credits" || hash === "billingcredits" || tabParam === "billing" || tabParam === "credits" || pathname.includes("/billing")) {
          return "Billing & Credits";
        }
        if (hash === "database" || hash === "databasetables" || hash === "tables" || tabParam === "database") {
          return "Database Tables";
        }
        if (hash === "bookings" || hash === "myreservations" || hash === "mybookings" || hash === "reservations" || tabParam === "bookings" || pathname.includes("/bookings")) {
          return "My Bookings";
        }
        if (hash === "meetingrooms" || hash === "rooms" || tabParam === "rooms" || tabParam === "meetingrooms") {
          return "Meeting Rooms";
        }
        var validTabs = ["Dashboard", "Meeting Rooms", "My Bookings", "Bookings", "Calendar", "My Reservations", "Billing & Credits", "Analytics", "Workspace & Desks", "Visitors", "Members", "Database Tables", "Settings"];
        return validTabs.find(function (t) {
          return t.toLowerCase().replace(/\s+/g, "") === hash;
        }) || "Dashboard";
      } catch (e) {
        return "Dashboard";
      }
    }),
    _useState2 = _slicedToArray(_useState, 2),
    activeNav = _useState2[0],
    setActiveNav = _useState2[1];
  var _useState3 = useState(INITIAL_ROOMS),
    _useState4 = _slicedToArray(_useState3, 2),
    rooms = _useState4[0],
    setRooms = _useState4[1];
  var _useState5 = useState("All Rooms"),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedType = _useState6[0],
    setSelectedType = _useState6[1];
  var _useState7 = useState([]),
    _useState8 = _slicedToArray(_useState7, 2),
    selectedAmenities = _useState8[0],
    setSelectedAmenities = _useState8[1];
  var _useState9 = useState("Cards"),
    _useState0 = _slicedToArray(_useState9, 2),
    viewMode = _useState0[0],
    setViewMode = _useState0[1];
  var _useState1 = useState(""),
    _useState10 = _slicedToArray(_useState1, 2),
    searchQuery = _useState10[0],
    setSearchQuery = _useState10[1];
  var _useState11 = useState("Fri, 30 Oct 2026"),
    _useState12 = _slicedToArray(_useState11, 2),
    selectedDate = _useState12[0],
    setSelectedDate = _useState12[1];
  var _useState13 = useState("09:00 AM – 11:00 AM"),
    _useState14 = _slicedToArray(_useState13, 2),
    selectedTime = _useState14[0],
    setSelectedTime = _useState14[1];
  var _useState15 = useState(4),
    _useState16 = _slicedToArray(_useState15, 2),
    selectedPeople = _useState16[0],
    setSelectedPeople = _useState16[1];
  var _useState17 = useState(new Set(["mr-1"])),
    _useState18 = _slicedToArray(_useState17, 2),
    favorites = _useState18[0],
    setFavorites = _useState18[1];
  var _useState19 = useState([{
      id: "bkg-1",
      resId: "RES-8901",
      date: "Today",
      day: "30",
      month: "OCT",
      fullDate: "Fri, 30 Oct 2026",
      time: "03:30 PM – 05:00 PM",
      title: "Design Review",
      room: "Collaboration Room",
      roomId: "mr-4",
      roomImage: "assets/rooms/mr-04-main.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
      attendees: 6,
      credits: 18,
      status: "Confirmed",
      isRecurring: false,
      purpose: "Sprint 4 UI/UX walkthrough, component polish and QA review.",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-blue-500"
    }, {
      id: "bkg-2",
      resId: "RES-8902",
      date: "31 Oct",
      day: "31",
      month: "OCT",
      fullDate: "Sat, 31 Oct 2026",
      time: "10:00 AM – 11:30 AM",
      title: "Weekly Sync",
      room: "Pitch Arena Nexus",
      roomId: "mr-2",
      roomImage: "assets/rooms/mr-02-main.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      attendees: 4,
      credits: 25,
      status: "Confirmed",
      isRecurring: true,
      recurringPattern: "Every Friday & Saturday",
      purpose: "Executive growth metrics, cap-table update & cohort deliverables.",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-emerald-500"
    }, {
      id: "bkg-3",
      resId: "RES-8903",
      date: "02 Nov",
      day: "02",
      month: "NOV",
      fullDate: "Mon, 02 Nov 2026",
      time: "11:00 AM – 12:30 PM",
      title: "Product Demo & Pitch",
      room: "Boardroom Alpha",
      roomId: "mr-1",
      roomImage: "assets/rooms/mr-01-main.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
      attendees: 8,
      credits: 30,
      status: "Pending",
      isRecurring: false,
      purpose: "Venture pitch to seed angel syndicates and incubation advisors.",
      statusColor: "bg-amber-50 text-amber-600 border border-amber-200",
      barColor: "bg-amber-500"
    }, {
      id: "bkg-4",
      resId: "RES-8904",
      date: "03 Nov",
      day: "03",
      month: "NOV",
      fullDate: "Tue, 03 Nov 2026",
      time: "02:00 PM – 04:00 PM",
      title: "Client Strategy Session",
      room: "Training Room",
      roomId: "mr-5",
      roomImage: "assets/rooms/mr-05-main.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      attendees: 12,
      credits: 40,
      status: "Cancelled",
      isRecurring: false,
      purpose: "Quarterly strategic roadmap session with enterprise partner.",
      statusColor: "bg-rose-50 text-rose-600 border border-rose-200",
      barColor: "bg-rose-500"
    }, {
      id: "bkg-5",
      resId: "RES-8905",
      date: "28 Oct",
      day: "28",
      month: "OCT",
      fullDate: "Wed, 28 Oct 2026",
      time: "04:00 PM – 05:00 PM",
      title: "Sprint Retrospective",
      room: "Focus Room",
      roomId: "mr-3",
      roomImage: "assets/rooms/mr-03-main.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
      attendees: 4,
      credits: 12,
      status: "Completed",
      isRecurring: true,
      recurringPattern: "Bi-weekly Wednesdays",
      purpose: "Sprint 3 team reflection, process blockers and action items.",
      statusColor: "bg-slate-100 text-slate-700 border border-slate-200",
      barColor: "bg-slate-400"
    }]),
    _useState20 = _slicedToArray(_useState19, 2),
    upcomingBookings = _useState20[0],
    setUpcomingBookings = _useState20[1];

  // My Bookings Filtering & Modal States
  var _useState21 = useState("All Bookings"),
    _useState22 = _slicedToArray(_useState21, 2),
    bookingsFilterTab = _useState22[0],
    setBookingsFilterTab = _useState22[1];
  var _useState23 = useState(""),
    _useState24 = _slicedToArray(_useState23, 2),
    bookingsSearchQuery = _useState24[0],
    setBookingsSearchQuery = _useState24[1];
  var _useState25 = useState("All Rooms"),
    _useState26 = _slicedToArray(_useState25, 2),
    bookingsRoomFilter = _useState26[0],
    setBookingsRoomFilter = _useState26[1];
  var _useState27 = useState("All Dates"),
    _useState28 = _slicedToArray(_useState27, 2),
    bookingsDateFilter = _useState28[0],
    setBookingsDateFilter = _useState28[1];
  var _useState29 = useState(null),
    _useState30 = _slicedToArray(_useState29, 2),
    rescheduleBooking = _useState30[0],
    setRescheduleBooking = _useState30[1];
  var _useState31 = useState("2026-11-04"),
    _useState32 = _slicedToArray(_useState31, 2),
    rescheduleNewDate = _useState32[0],
    setRescheduleNewDate = _useState32[1];
  var _useState33 = useState("02:00 PM – 03:30 PM"),
    _useState34 = _slicedToArray(_useState33, 2),
    rescheduleNewTime = _useState34[0],
    setRescheduleNewTime = _useState34[1];
  var _useState35 = useState(""),
    _useState36 = _slicedToArray(_useState35, 2),
    rescheduleNewRoom = _useState36[0],
    setRescheduleNewRoom = _useState36[1];
  var _useState37 = useState(null),
    _useState38 = _slicedToArray(_useState37, 2),
    cancelModalBooking = _useState38[0],
    setCancelModalBooking = _useState38[1];
  var _useState39 = useState(null),
    _useState40 = _slicedToArray(_useState39, 2),
    detailsModalBooking = _useState40[0],
    setDetailsModalBooking = _useState40[1];
  var _useState41 = useState([{
      time: "09:00 AM – 11:00 AM",
      title: "Product Planning",
      room: "Boardroom Alpha",
      attendees: 8,
      dotColor: "bg-emerald-500",
      tintColor: "border-l-4 border-l-emerald-500"
    }, {
      time: "11:30 AM – 01:00 PM",
      title: "Client Meeting",
      room: "Pitch Arena Nexus",
      attendees: 4,
      dotColor: "bg-blue-500",
      tintColor: "border-l-4 border-l-blue-500"
    }, {
      time: "02:00 PM – 03:00 PM",
      title: "Team Sync",
      room: "Focus Room",
      attendees: 3,
      dotColor: "bg-amber-500",
      tintColor: "border-l-4 border-l-amber-500"
    }, {
      time: "03:30 PM – 05:00 PM",
      title: "Design Review",
      room: "Collaboration Room",
      attendees: 6,
      dotColor: "bg-indigo-500",
      tintColor: "border-l-4 border-l-indigo-500"
    }]),
    _useState42 = _slicedToArray(_useState41, 2),
    todaysSchedule = _useState42[0],
    setTodaysSchedule = _useState42[1];

  // ── Live Meeting Room Booking Popup & Real-Time Availability States ──
  var _useState43 = useState(null),
    _useState44 = _slicedToArray(_useState43, 2),
    bookingModalRoom = _useState44[0],
    setBookingModalRoom = _useState44[1];
  var _useState45 = useState(""),
    _useState46 = _slicedToArray(_useState45, 2),
    bookingTitle = _useState46[0],
    setBookingTitle = _useState46[1];
  var _useState47 = useState("2026-10-31"),
    _useState48 = _slicedToArray(_useState47, 2),
    bookingDate = _useState48[0],
    setBookingDate = _useState48[1];
  var _useState49 = useState("11:30 AM"),
    _useState50 = _slicedToArray(_useState49, 2),
    bookingStartTime = _useState50[0],
    setBookingStartTime = _useState50[1];
  var _useState51 = useState(1.0),
    _useState52 = _slicedToArray(_useState51, 2),
    bookingDuration = _useState52[0],
    setBookingDuration = _useState52[1];
  var _useState53 = useState(4),
    _useState54 = _slicedToArray(_useState53, 2),
    bookingAttendees = _useState54[0],
    setBookingAttendees = _useState54[1];
  var _useState55 = useState(""),
    _useState56 = _slicedToArray(_useState55, 2),
    bookingNotes = _useState56[0],
    setBookingNotes = _useState56[1];
  var _useState57 = useState(true),
    _useState58 = _slicedToArray(_useState57, 2),
    bookingSyncGCal = _useState58[0],
    setBookingSyncGCal = _useState58[1];
  var _useState59 = useState([]),
    _useState60 = _slicedToArray(_useState59, 2),
    roomBackendBookings = _useState60[0],
    setRoomBackendBookings = _useState60[1];
  var _useState61 = useState(false),
    _useState62 = _slicedToArray(_useState61, 2),
    isLoadingAvailability = _useState62[0],
    setIsLoadingAvailability = _useState62[1];
  var _useState63 = useState(113),
    _useState64 = _slicedToArray(_useState63, 2),
    startupCreditsRemaining = _useState64[0],
    setStartupCreditsRemaining = _useState64[1];
  var _useState65 = useState(null),
    _useState66 = _slicedToArray(_useState65, 2),
    bookingSuccessData = _useState66[0],
    setBookingSuccessData = _useState66[1];

  var _useStateCalView = useState("Day"),
    calendarView = _useStateCalView[0],
    setCalendarView = _useStateCalView[1];

  var _useStateAnalyticsPer = useState("This Month"),
    analyticsPeriod = _useStateAnalyticsPer[0],
    setAnalyticsPeriod = _useStateAnalyticsPer[1];

  var _useStateDeskFloor = useState("Ground Floor (East Wing)"),
    activeDeskFloor = _useStateDeskFloor[0],
    setActiveDeskFloor = _useStateDeskFloor[1];

  var _useStateVisTab = useState("All Visitors"),
    visitorsTab = _useStateVisTab[0],
    setVisitorsTab = _useStateVisTab[1];

  var _useStateVisModal = useState(false),
    isVisitorModalOpen = _useStateVisModal[0],
    setIsVisitorModalOpen = _useStateVisModal[1];

  var _useStateNewVis = useState({ name: "", org: "", host: "Alex Morgan", room: "Boardroom Alpha", time: "10:00 AM" }),
    newVisitorData = _useStateNewVis[0],
    setNewVisitorData = _useStateNewVis[1];

  var _useStateVisitorsList = useState([
    { id: "v-1", name: "Vikram Malhotra", org: "Sequoia Capital", host: "Alex Morgan", room: "Boardroom Alpha", time: "09:00 AM", status: "Pass Issued" },
    { id: "v-2", name: "Dr. Ananya Rao", org: "Apollo Health Tech", host: "Sarah Chen", room: "Collaboration Room", time: "03:30 PM", status: "Checked In" },
    { id: "v-3", name: "Rohit Sharma", org: "Nexus Capital", host: "David Kim", room: "Pitch Arena Nexus", time: "11:30 AM", status: "Completed" },
    { id: "v-4", name: "Meera Nair", org: "AWS Cloud", host: "Priya Patel", room: "Focus Room", time: "05:00 PM", status: "Pass Issued" }
  ]),
    visitorsList = _useStateVisitorsList[0],
    setVisitorsList = _useStateVisitorsList[1];

  var _useStateMemSearch = useState(""),
    memberSearchQuery = _useStateMemSearch[0],
    setMemberSearchQuery = _useStateMemSearch[1];

  var _useStateInvModal = useState(false),
    isInviteModalOpen = _useStateInvModal[0],
    setIsInviteModalOpen = _useStateInvModal[1];

  var _useStateNewMem = useState({ name: "", email: "", role: "AI Engineer", desk: "Desk 4E (Floating)" }),
    newMemberData = _useStateNewMem[0],
    setNewMemberData = _useStateNewMem[1];

  var _useStateMembersList = useState([
    { id: "m-1", name: "Alex Morgan", role: "Co-Founder & CEO", email: "alex.m@xyztech.io", avatar: "AM", desk: "Desk 4A", hoursBooked: 14, access: "Full Incubator Admin" },
    { id: "m-2", name: "Sarah Chen", role: "CTO & Co-Founder", email: "sarah.c@xyztech.io", avatar: "SC", desk: "Desk 4B", hoursBooked: 10, access: "Full Incubator Admin" },
    { id: "m-3", name: "David Kim", role: "Head of Product", email: "david.k@xyztech.io", avatar: "DK", desk: "Desk 4C", hoursBooked: 8, access: "Member Access" },
    { id: "m-4", name: "Priya Patel", role: "Lead AI Engineer", email: "priya.p@xyztech.io", avatar: "PP", desk: "Desk 4D", hoursBooked: 6, access: "Member Access" },
    { id: "m-5", name: "Arjun Reddy", role: "Full-Stack Engineer", email: "arjun.r@xyztech.io", avatar: "AR", desk: "Desk 4E (Floating)", hoursBooked: 4, access: "Member Access" },
    { id: "m-6", name: "Sneha Joshi", role: "UI/UX Designer", email: "sneha.j@xyztech.io", avatar: "SJ", desk: "Desk 4F (Floating)", hoursBooked: 2, access: "Member Access" }
  ]),
    membersList = _useStateMembersList[0],
    setMembersList = _useStateMembersList[1];
  var getTodayDateIso = function getTodayDateIso() {
    return "2026-10-31";
  };
  var getTomorrowDateIso = function getTomorrowDateIso() {
    return "2026-11-01";
  };
  var handleSetToday = function handleSetToday() {
    setBookingDate(getTodayDateIso());
    showToast("📅 Switched to Today's availability (31 Oct)");
  };
  var handleSetNextDay = function handleSetNextDay() {
    setBookingDate(getTomorrowDateIso());
    showToast("📅 Switched to Next Day's availability (01 Nov)");
  };
  var openBookingDrawer = function openBookingDrawer(room) {
    if (!room) return;
    setBookingModalRoom(room);
    setBookingTitle("Strategy Sync (".concat(room.name, ")"));
    setBookingDate(getTodayDateIso());
    setBookingStartTime("11:30 AM");
    setBookingDuration(1.0);
    setBookingAttendees(Math.min(selectedPeople || 4, room.capacity));
    setBookingNotes("");
    setBookingSyncGCal(true);
    setBookingSuccessData(null);
  };
  var TIME_SLOTS_12H = ["08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"];
  var timeStrToMinutes = function timeStrToMinutes(str) {
    if (!str) return 0;
    var parts = str.trim().split(/\s+/);
    var time = parts[0];
    var ampm = (parts[1] || "").toUpperCase();
    var _time$split = time.split(":"),
      _time$split2 = _slicedToArray(_time$split, 2),
      hStr = _time$split2[0],
      mStr = _time$split2[1];
    var h = parseInt(hStr, 10);
    var m = parseInt(mStr, 10) || 0;
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };
  var minutesToTimeStr = function minutesToTimeStr(totalMins) {
    var h = Math.floor(totalMins / 60);
    var m = totalMins % 60;
    var ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return "".concat(String(h).padStart(2, "0"), ":").concat(String(m).padStart(2, "0"), " ").concat(ampm);
  };
  var getSlotState = function getSlotState(slotTime, room, date, startTime, duration) {
    if (!room) return {
      status: "available",
      label: "Available"
    };
    var slotMins = timeStrToMinutes(slotTime);
    var selectedStartMins = timeStrToMinutes(startTime);
    var selectedEndMins = selectedStartMins + Math.round(duration * 60);
    var todayStr = getTodayDateIso();
    var isPastDate = date < todayStr;
    var isPastSlot = false;
    if (isPastDate) {
      isPastSlot = true;
    } else if (date === todayStr) {
      var nowHr = new Date().getHours();
      var nowMin = new Date().getMinutes();
      var currentClock = nowHr * 60 + nowMin;
      var threshold = nowHr >= 8 && nowHr <= 20 ? currentClock : 11 * 60;
      if (slotMins < threshold) {
        isPastSlot = true;
      }
    }
    if (isPastSlot) {
      return {
        status: "past",
        label: "Past / Completed",
        isPast: true,
        disabled: true
      };
    }
    var allBookings = [].concat(_toConsumableArray(upcomingBookings.filter(function (b) {
      return b.status !== "Cancelled" && (b.room === room.name || b.roomId === room.id);
    })), _toConsumableArray(roomBackendBookings.filter(function (b) {
      return b.status !== "Cancelled";
    })));
    var _iterator = _createForOfIteratorHelper(allBookings),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var b = _step.value;
        var matchDate = b.date === date || date === todayStr && b.date === "Today" || b.fullDate === date;
        if (!matchDate) continue;
        var bStart = 0;
        var bEnd = 0;
        if (b.time && b.time.includes("–")) {
          var _b$time$split = b.time.split("–"),
            _b$time$split2 = _slicedToArray(_b$time$split, 2),
            s = _b$time$split2[0],
            e = _b$time$split2[1];
          bStart = timeStrToMinutes(s.trim());
          bEnd = timeStrToMinutes(e.trim());
        } else if (b.startTime && b.endTime) {
          bStart = timeStrToMinutes(b.startTime);
          bEnd = timeStrToMinutes(b.endTime);
        } else {
          bStart = timeStrToMinutes(b.time);
          bEnd = bStart + 60;
        }
        if (slotMins >= bStart && slotMins < bEnd) {
          return {
            status: "booked",
            label: "Booked",
            isBooked: true,
            disabled: true
          };
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    if (slotMins >= selectedStartMins && slotMins < selectedEndMins) {
      return {
        status: "selected",
        label: "Selected",
        isSelected: true,
        disabled: false
      };
    }
    var reqEndMins = slotMins + Math.round(duration * 60);
    if (reqEndMins > 1200) {
      return {
        status: "unavailable",
        label: "Exceeds Hours",
        isConflict: true,
        disabled: true
      };
    }
    var _iterator2 = _createForOfIteratorHelper(allBookings),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _b = _step2.value;
        var _matchDate = _b.date === date || date === todayStr && _b.date === "Today" || _b.fullDate === date;
        if (!_matchDate) continue;
        var _bStart = 0;
        var _bEnd = 0;
        if (_b.time && _b.time.includes("–")) {
          var _b$time$split3 = _b.time.split("–"),
            _b$time$split4 = _slicedToArray(_b$time$split3, 2),
            _s = _b$time$split4[0],
            _e = _b$time$split4[1];
          _bStart = timeStrToMinutes(_s.trim());
          _bEnd = timeStrToMinutes(_e.trim());
        } else if (_b.startTime && _b.endTime) {
          _bStart = timeStrToMinutes(_b.startTime);
          _bEnd = timeStrToMinutes(_b.endTime);
        } else {
          _bStart = timeStrToMinutes(_b.time);
          _bEnd = _bStart + 60;
        }
        if (Math.max(slotMins, _bStart) < Math.min(reqEndMins, _bEnd)) {
          return {
            status: "unavailable",
            label: "Overlap Conflict",
            isConflict: true,
            disabled: true
          };
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    return {
      status: "available",
      label: "Available",
      isAvailable: true,
      disabled: false
    };
  };
  var getGCalUrl = function getGCalUrl(booking) {
    var dStr = (booking.fullDate || booking.date || "2026-10-31").replace(/-/g, "").replace("Today", "20261031");
    var startMin = timeStrToMinutes(booking.startTime);
    var endMin = timeStrToMinutes(booking.endTime);
    var startH = String(Math.floor(startMin / 60)).padStart(2, "0");
    var startM = String(startMin % 60).padStart(2, "0");
    var endH = String(Math.floor(endMin / 60)).padStart(2, "0");
    var endM = String(endMin % 60).padStart(2, "0");
    var startIso = "".concat(dStr, "T").concat(startH).concat(startM, "00");
    var endIso = "".concat(dStr, "T").concat(endH).concat(endM, "00");
    var text = encodeURIComponent("".concat(booking.title, " \u2022 ").concat(booking.room));
    var details = encodeURIComponent("NEXUS HUB Reservation: ".concat(booking.room, "\nDuration: ").concat(booking.duration, "\nAttendees: ").concat(booking.attendees, " people\nLocation: Ground Floor East Wing, NEXUS HUB Innovation Campus"));
    var loc = encodeURIComponent("".concat(booking.room, ", NEXUS HUB Innovation Campus"));
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=".concat(text, "&dates=").concat(startIso, "/").concat(endIso, "&details=").concat(details, "&location=").concat(loc);
  };
  var downloadIcsFile = function downloadIcsFile(booking) {
    var dStr = (booking.fullDate || booking.date || "2026-10-31").replace(/-/g, "").replace("Today", "20261031");
    var startMin = timeStrToMinutes(booking.startTime);
    var endMin = timeStrToMinutes(booking.endTime);
    var startH = String(Math.floor(startMin / 60)).padStart(2, "0");
    var startM = String(startMin % 60).padStart(2, "0");
    var endH = String(Math.floor(endMin / 60)).padStart(2, "0");
    var endM = String(endMin % 60).padStart(2, "0");
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NEXUS HUB//Booking//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", "UID:".concat(booking.resId || Date.now(), "@nexushub.co"), "DTSTAMP:".concat(dStr, "T000000Z"), "DTSTART:".concat(dStr, "T").concat(startH).concat(startM, "00"), "DTEND:".concat(dStr, "T").concat(endH).concat(endM, "00"), "SUMMARY:".concat(booking.title, " - ").concat(booking.room), "DESCRIPTION:NEXUS HUB Reservation for ".concat(booking.attendees, " attendees"), "LOCATION:".concat(booking.room, ", NEXUS HUB"), "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var blob = new Blob([ics], {
      type: "text/calendar;charset=utf-8"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "nexus-".concat((booking.resId || "bkg").toLowerCase(), ".ics");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  var handleConfirmBookingModal = function handleConfirmBookingModal(e) {
    if (e) e.preventDefault();
    if (!bookingModalRoom) return;
    var slotState = getSlotState(bookingStartTime, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
    if (slotState.disabled && !slotState.isSelected) {
      showToast("\u26A0\uFE0F Conflict: Selected start time is ".concat(slotState.label, ". Please pick an available slot."));
      return;
    }
    var startMin = timeStrToMinutes(bookingStartTime);
    var endMin = startMin + Math.round(bookingDuration * 60);
    var endTimeStr = minutesToTimeStr(endMin);
    var formattedRange = "".concat(bookingStartTime, " \u2013 ").concat(endTimeStr);
    var resId = "RES-2026-".concat(Math.floor(1000 + Math.random() * 9000));
    var title = bookingTitle.trim() || "Strategy Sync (".concat(bookingModalRoom.name, ")");
    var hourlyRate = parseInt((bookingModalRoom.rate || "").replace(/[^0-9]/g, ""), 10) || 2000;
    var totalCost = Math.round(hourlyRate * bookingDuration);
    setStartupCreditsRemaining(function (prev) {
      return Math.max(0, prev - bookingDuration);
    });
    var newBooking = {
      id: "bkg-".concat(Date.now()),
      resId: resId,
      date: bookingDate === "2026-10-31" ? "Today" : bookingDate,
      fullDate: bookingDate,
      time: formattedRange,
      startTime: bookingStartTime,
      endTime: endTimeStr,
      duration: "".concat(bookingDuration, " hrs"),
      title: title,
      room: bookingModalRoom.name,
      roomId: bookingModalRoom.id,
      roomImage: bookingModalRoom.image || "assets/rooms/mr-01-main.jpg",
      attendees: bookingAttendees,
      credits: bookingDuration,
      cost: totalCost,
      notes: bookingNotes,
      status: "Confirmed",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-emerald-500",
      createdAt: new Date().toISOString()
    };
    setUpcomingBookings(function (prev) {
      return [newBooking].concat(_toConsumableArray(prev));
    });
    if (bookingDate === "2026-10-31" || bookingDate === "Today") {
      setTodaysSchedule(function (prev) {
        return [].concat(_toConsumableArray(prev), [{
          time: formattedRange,
          title: title,
          room: bookingModalRoom.name,
          attendees: bookingAttendees,
          dotColor: "bg-emerald-500",
          tintColor: "border-l-4 border-l-emerald-500"
        }]);
      });
    }
    setBookingSuccessData(newBooking);
    showToast("\uD83C\uDF89 Room booked! ".concat(bookingModalRoom.name, " confirmed (#").concat(resId, ")"));
    try {
      fetch('/api/meeting-rooms/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: bookingModalRoom.id || "MR-01",
          startupId: "STP-XYZ",
          startupName: "XYZ Technologies",
          title: title,
          date: bookingDate,
          startTime: bookingStartTime,
          endTime: endTimeStr,
          attendees: bookingAttendees,
          cost: totalCost
        })
      })["catch"](function (err) {
        return console.log('Backend sync offline:', err);
      });
    } catch (e) {}
  };
  useEffect(function () {
    if (!bookingModalRoom || !bookingDate) return;
    setIsLoadingAvailability(true);
    fetch("/api/meeting-rooms/availability?date=".concat(bookingDate)).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (data && data.ok && data.rooms) {
        var r = data.rooms.find(function (x) {
          return x.id === bookingModalRoom.id || x.name === bookingModalRoom.name;
        });
        if (r && r.bookings) {
          setRoomBackendBookings(r.bookings);
        } else {
          setRoomBackendBookings([]);
        }
      }
    })["catch"](function (e) {
      return console.log("Availability offline fallback:", e);
    })["finally"](function () {
      return setIsLoadingAvailability(false);
    });
  }, [bookingModalRoom, bookingDate]);
  var DASHBOARD_ACTIVITIES = [{
    id: "act-1",
    time: "12m ago",
    icon: "calendar",
    title: "Room Reservation Confirmed",
    desc: "Collaboration Room reserved for Today at 03:00 PM (30 credits)",
    user: "Alex Morgan"
  }, {
    id: "act-2",
    time: "1h ago",
    icon: "users",
    title: "Visitor Gate Pass Issued",
    desc: "Pass #VP-9021 issued for Kiran Mehta (Apex Ventures)",
    user: "David Chen"
  }, {
    id: "act-3",
    time: "Yesterday",
    icon: "creditCard",
    title: "Monthly Credit Grant Active",
    desc: "+80 credits added under Growth Startup Package",
    user: "System Auto-Credit"
  }, {
    id: "act-4",
    time: "2 days ago",
    icon: "building",
    title: "Smart Lock Keycard Verified",
    desc: "Access active for Suite 401 & 24/7 Floor Turnstiles",
    user: "Incubation Security"
  }];

  // Database Tables Explorer States
  var _useState67 = useState("startups"),
    _useState68 = _slicedToArray(_useState67, 2),
    dbCollection = _useState68[0],
    setDbCollection = _useState68[1];
  var _useState69 = useState(""),
    _useState70 = _slicedToArray(_useState69, 2),
    dbSearch = _useState70[0],
    setDbSearch = _useState70[1];
  var _useState71 = useState(null),
    _useState72 = _slicedToArray(_useState71, 2),
    selectedDbDoc = _useState72[0],
    setSelectedDbDoc = _useState72[1];
  var DB_COLLECTIONS = {
    startups: [{
      _id: "stp_65fa8910b",
      name: "XYZ Technologies",
      founder: "Alex Morgan",
      cohort: "Batch 2026-A",
      tier: "Growth",
      creditsRemaining: 80,
      seatsBooked: 8,
      status: "Active",
      updatedAt: "2026-10-30 17:15"
    }, {
      _id: "stp_65fa8911c",
      name: "CloudMorph AI",
      founder: "Sarah Jenkins",
      cohort: "Batch 2026-A",
      tier: "Seed",
      creditsRemaining: 140,
      seatsBooked: 12,
      status: "Active",
      updatedAt: "2026-10-30 16:40"
    }, {
      _id: "stp_65fa8912d",
      name: "Nova BioLabs",
      founder: "Dr. Vikram Seth",
      cohort: "Batch 2025-B",
      tier: "Incubated",
      creditsRemaining: 45,
      seatsBooked: 6,
      status: "Active",
      updatedAt: "2026-10-30 14:20"
    }, {
      _id: "stp_65fa8913e",
      name: "FinPulse Global",
      founder: "Elena Rostova",
      cohort: "Batch 2026-A",
      tier: "Scaleup",
      creditsRemaining: 210,
      seatsBooked: 16,
      status: "Active",
      updatedAt: "2026-10-29 18:05"
    }, {
      _id: "stp_65fa8914f",
      name: "Aerotech Dynamics",
      founder: "Kiran Rao",
      cohort: "Batch 2025-C",
      tier: "Growth",
      creditsRemaining: 95,
      seatsBooked: 10,
      status: "Active",
      updatedAt: "2026-10-29 11:30"
    }, {
      _id: "stp_65fa8915a",
      name: "GreenGrid Energy",
      founder: "Marcus Vance",
      cohort: "Batch 2026-B",
      tier: "Early Stage",
      creditsRemaining: 60,
      seatsBooked: 4,
      status: "Pending Audit",
      updatedAt: "2026-10-28 09:12"
    }],
    meeting_rooms: [{
      _id: "room_001",
      name: "Boardroom Alpha",
      type: "Boardroom",
      capacity: 12,
      creditsPerHour: 20,
      floor: "Level 4",
      status: "In Use",
      equipment: ["4K Display", "Video Conf", "Whiteboard", "High-speed Wi-Fi"]
    }, {
      _id: "room_002",
      name: "Pitch Arena Nexus",
      type: "Conference",
      capacity: 25,
      creditsPerHour: 35,
      floor: "Level 3",
      status: "Available",
      equipment: ["Dual Projector", "Stage Mics", "Tiered Seating", "Live Stream Ready"]
    }, {
      _id: "room_003",
      name: "Focus Room 1",
      type: "Focus",
      capacity: 4,
      creditsPerHour: 10,
      floor: "Level 2",
      status: "Available",
      equipment: ["Soundproof", "Ultra-wide Screen", "Ergo Chairs"]
    }, {
      _id: "room_004",
      name: "Collaboration Suite",
      type: "Meeting",
      capacity: 8,
      creditsPerHour: 15,
      floor: "Level 4",
      status: "Available",
      equipment: ["Whiteboard Wall", "Jabra Speaker", "Coffee Machine"]
    }, {
      _id: "room_005",
      name: "Training Room",
      type: "Workshop",
      capacity: 30,
      creditsPerHour: 40,
      floor: "Level 1",
      status: "Available",
      equipment: ["Podium", "Surround Sound", "Modular Desks"]
    }, {
      _id: "room_006",
      name: "Creative Studio",
      type: "Media",
      capacity: 6,
      creditsPerHour: 25,
      floor: "Level 2",
      status: "Available",
      equipment: ["Green Screen", "Studio Lighting", "Podcast Mics"]
    }],
    reservations: [{
      _id: "res_9823101",
      roomName: "Collaboration Room",
      bookedBy: "Alex Morgan (XYZ Tech)",
      date: "2026-10-30",
      slot: "03:00 PM – 04:30 PM",
      creditsCost: 30,
      status: "Confirmed",
      paymentMethod: "Startup Credits"
    }, {
      _id: "res_9823102",
      roomName: "Pitch Arena Nexus",
      bookedBy: "Sarah Jenkins (CloudMorph)",
      date: "2026-10-31",
      slot: "10:00 AM – 12:00 PM",
      creditsCost: 70,
      status: "Confirmed",
      paymentMethod: "Startup Credits"
    }, {
      _id: "res_9823103",
      roomName: "Boardroom Alpha",
      bookedBy: "Dr. Vikram Seth (Nova Bio)",
      date: "2026-10-30",
      slot: "01:30 PM – 03:00 PM",
      creditsCost: 30,
      status: "In Progress",
      paymentMethod: "Startup Credits"
    }, {
      _id: "res_9823104",
      roomName: "Training Room",
      bookedBy: "Incubation Admin",
      date: "2026-11-01",
      slot: "09:00 AM – 01:00 PM",
      creditsCost: 0,
      status: "Internal",
      paymentMethod: "Admin Override"
    }, {
      _id: "res_9823105",
      roomName: "Focus Room 1",
      bookedBy: "Elena Rostova (FinPulse)",
      date: "2026-11-02",
      slot: "11:00 AM – 12:00 PM",
      creditsCost: 10,
      status: "Confirmed",
      paymentMethod: "Startup Credits"
    }],
    workspaces: [{
      _id: "ws_401",
      label: "Executive Private Suite 401",
      type: "Private Office",
      capacity: 12,
      tenant: "XYZ Technologies",
      status: "Occupied",
      monthlyRate: "$2,400"
    }, {
      _id: "ws_302",
      label: "Dedicated Pod 3B",
      type: "Dedicated Desks",
      capacity: 6,
      tenant: "Nova BioLabs",
      status: "Occupied",
      monthlyRate: "$1,200"
    }, {
      _id: "ws_205",
      label: "Open Hot Desk Hub A",
      type: "Hot Desk",
      capacity: 20,
      tenant: "Multi-tenant",
      status: "Available",
      monthlyRate: "$180/desk"
    }, {
      _id: "ws_405",
      label: "Studio Suite 405",
      type: "Private Office",
      capacity: 8,
      tenant: "Vacant (Available)",
      status: "Ready to Move",
      monthlyRate: "$1,650"
    }],
    invoices: [{
      _id: "inv_2026_091",
      invoiceNumber: "NEXUS-INV-091",
      recipient: "XYZ Technologies",
      type: "Room Credits Top-up",
      amount: "$350.00",
      date: "2026-10-24",
      status: "Paid",
      gateway: "Razorpay"
    }, {
      _id: "inv_2026_088",
      invoiceNumber: "NEXUS-INV-088",
      recipient: "CloudMorph AI",
      type: "Monthly Desk Lease",
      amount: "$2,400.00",
      date: "2026-10-01",
      status: "Paid",
      gateway: "Stripe"
    }, {
      _id: "inv_2026_082",
      invoiceNumber: "NEXUS-INV-082",
      recipient: "FinPulse Global",
      type: "Conference Room Package",
      amount: "$500.00",
      date: "2026-09-28",
      status: "Paid",
      gateway: "Wire"
    }],
    members: [{
      _id: "usr_001",
      fullName: "Alex Morgan",
      role: "Co-Founder & CTO",
      company: "XYZ Technologies",
      email: "alex@xyztech.io",
      accessLevel: "Admin",
      badgeId: "NX-8821",
      status: "Active"
    }, {
      _id: "usr_002",
      fullName: "Sarah Jenkins",
      role: "CEO",
      company: "CloudMorph AI",
      email: "sarah@cloudmorph.ai",
      accessLevel: "Admin",
      badgeId: "NX-7712",
      status: "Active"
    }, {
      _id: "usr_003",
      fullName: "Dr. Vikram Seth",
      role: "Principal Researcher",
      company: "Nova BioLabs",
      email: "vikram@novabio.org",
      accessLevel: "Member",
      badgeId: "NX-6604",
      status: "Active"
    }, {
      _id: "usr_004",
      fullName: "David Chen",
      role: "Lead Engineer",
      company: "XYZ Technologies",
      email: "david@xyztech.io",
      accessLevel: "Member",
      badgeId: "NX-8824",
      status: "Active"
    }]
  };

  // Hash Sync
  var navigateTo = function navigateTo(navName) {
    setActiveNav(navName);
    window.location.hash = navName.toLowerCase().replace(/\s+/g, "-");
  };
  useEffect(function () {
    var handleHashChange = function handleHashChange() {
      var hash = window.location.hash.replace("#", "").toLowerCase().replace(/[-_]/g, "");
      if (hash === "billing" || hash === "credits" || hash === "billingcredits") {
        setActiveNav("Billing & Credits");
        return;
      }
      if (hash === "database" || hash === "databasetables" || hash === "tables") {
        setActiveNav("Database Tables");
        return;
      }
      if (hash === "bookings" || hash === "myreservations" || hash === "mybookings" || hash === "reservations") {
        setActiveNav("My Bookings");
        return;
      }
      var validTabs = ["Dashboard", "Meeting Rooms", "My Bookings", "Bookings", "Calendar", "My Reservations", "Billing & Credits", "Analytics", "Workspace & Desks", "Visitors", "Members", "Database Tables", "Settings"];
      var found = validTabs.find(function (t) {
        return t.toLowerCase().replace(/\s+/g, "") === hash;
      });
      if (found) setActiveNav(found);
    };
    window.addEventListener("hashchange", handleHashChange);
    return function () {
      return window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  var showToast = function showToast(msg) {
    setToastMessage(msg);
    setTimeout(function () {
      return setToastMessage(null);
    }, 3500);
  };
  var toggleFavorite = function toggleFavorite(id, e) {
    e.stopPropagation();
    setFavorites(function (prev) {
      var next = new Set(prev);
      if (next.has(id)) {
        next["delete"](id);
        showToast("Removed from favorites");
      } else {
        next.add(id);
        showToast("Added to favorite rooms ❤️");
      }
      return next;
    });
  };
  var toggleAmenity = function toggleAmenity(name) {
    setSelectedAmenities(function (prev) {
      return prev.includes(name) ? prev.filter(function (a) {
        return a !== name;
      }) : [].concat(_toConsumableArray(prev), [name]);
    });
  };
  var filteredRooms = useMemo(function () {
    return rooms.filter(function (room) {
      if (selectedType !== "All Rooms" && room.type !== selectedType) return false;
      if (room.capacity < selectedPeople) return false;
      if (selectedAmenities.length > 0) {
        var hasAll = selectedAmenities.every(function (a) {
          return room.amenities.includes(a);
        });
        if (!hasAll) return false;
      }
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        var matchName = room.name.toLowerCase().includes(q);
        var matchType = room.type.toLowerCase().includes(q);
        var matchAmenity = room.amenities.some(function (a) {
          return a.toLowerCase().includes(q);
        });
        if (!matchName && !matchType && !matchAmenity) return false;
      }
      return true;
    });
  }, [rooms, selectedType, selectedPeople, selectedAmenities, searchQuery]);
  var handleConfirmBooking = function handleConfirmBooking(e) {
    e.preventDefault();
    if (!bookingModalRoom) return;
    var title = meetingTitleInput.trim() || "Strategy Sync (".concat(bookingModalRoom.name, ")");
    var newBooking = {
      id: "bkg-".concat(Date.now()),
      date: "Today",
      time: selectedTime.split("–")[0].trim() || "09:00 AM",
      title: title,
      room: bookingModalRoom.name,
      attendees: selectedPeople,
      status: "Confirmed",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-emerald-500"
    };
    setUpcomingBookings(function (prev) {
      return [newBooking].concat(_toConsumableArray(prev));
    });
    setTodaysSchedule(function (prev) {
      return [].concat(_toConsumableArray(prev), [{
        time: selectedTime,
        title: title,
        room: bookingModalRoom.name,
        attendees: selectedPeople,
        dotColor: "bg-emerald-500",
        tintColor: "border-l-4 border-l-emerald-500"
      }]);
    });
    showToast("\uD83C\uDF89 Room booked! ".concat(bookingModalRoom.name, " confirmed."));
    setBookingModalRoom(null);
    setMeetingTitleInput("");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex min-h-screen bg-[#F6F7FB] text-[#374151] antialiased"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "w-[235px] flex-shrink-0 bg-white border-r border-[#ECEEF4] flex flex-col justify-between py-5 px-3 min-h-screen sticky top-0 h-screen select-none z-40"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 px-3 mb-6 cursor-pointer",
    onClick: function onClick() {
      return navigateTo("Dashboard");
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-yellow-400 shadow-sm flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bolt",
    className: "w-5 h-5 text-yellow-400",
    strokeWidth: 2.2
  })), /*#__PURE__*/React.createElement("div", {
    className: "leading-tight"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-extrabold text-[15px] tracking-tight text-[#111827]"
  }, "NEXUS HUB"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-medium text-[#8A90A2]"
  }, "Coworking Space"))), /*#__PURE__*/React.createElement("nav", {
    className: "space-y-1"
  }, [{
    name: "Dashboard",
    icon: "layoutDashboard"
  }, {
    name: "Meeting Rooms",
    icon: "calendar"
  }, {
    name: "My Bookings",
    icon: "bookmark"
  }, {
    name: "Calendar",
    icon: "calendarDays"
  }, {
    name: "Billing & Credits",
    icon: "creditCard"
  }, {
    name: "Analytics",
    icon: "barChart"
  }].map(function (item) {
    var isActive = activeNav === item.name || item.name === "My Bookings" && (activeNav === "Bookings" || activeNav === "My Reservations");
    return /*#__PURE__*/React.createElement("button", {
      key: item.name,
      onClick: function onClick() {
        return navigateTo(item.name);
      },
      className: "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ".concat(isActive ? "bg-[#EEEBFF] text-[#4F3FE0] font-semibold" : "text-[#374151] hover:bg-[#F8F9FD] hover:text-[#111827]")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      className: "w-4 h-4 ".concat(isActive ? "text-[#4F3FE0]" : "text-[#8A90A2]"),
      strokeWidth: isActive ? 2 : 1.7
    }), /*#__PURE__*/React.createElement("span", null, item.name));
  }), /*#__PURE__*/React.createElement("div", {
    className: "h-[1px] bg-[#ECEEF4] my-3 mx-2"
  }), [{
    name: "Workspace & Desks",
    icon: "building"
  }, {
    name: "Visitors",
    icon: "users"
  }, {
    name: "Members",
    icon: "users"
  }, {
    name: "Database Tables",
    icon: "database"
  }].map(function (item) {
    var isActive = activeNav === item.name;
    return /*#__PURE__*/React.createElement("button", {
      key: item.name,
      onClick: function onClick() {
        return navigateTo(item.name);
      },
      className: "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ".concat(isActive ? "bg-[#EEEBFF] text-[#4F3FE0] font-semibold" : "text-[#374151] hover:bg-[#F8F9FD] hover:text-[#111827]")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      className: "w-4 h-4 ".concat(isActive ? "text-[#4F3FE0]" : "text-[#8A90A2]"),
      strokeWidth: isActive ? 2 : 1.7
    }), /*#__PURE__*/React.createElement("span", null, item.name));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#F4F2FF] border border-[#E3DEFF] rounded-2xl p-4 mt-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[#4F3FE0] text-xs font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "crown",
    className: "w-3.5 h-3.5 text-[#4F3FE0]",
    strokeWidth: 2
  }), /*#__PURE__*/React.createElement("span", null, "Startup Plan")), /*#__PURE__*/React.createElement("div", {
    className: "text-[19px] font-black text-[#111827] mt-1"
  }, "120 credits"), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-1.5 bg-[#E4DEFF] rounded-full mt-2.5 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-[#4F3FE0] rounded-full w-[33%] transition-all duration-500"
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-medium text-[#8A90A2] mt-1.5"
  }, "80 credits left"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Billing & Credits");
    },
    className: "w-full mt-3 bg-[#4F3FE0] hover:bg-[#4335C9] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
  }, "Upgrade Plan"))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col min-w-0"
  }, /*#__PURE__*/React.createElement("header", {
    className: "h-[70px] bg-white border-b border-[#ECEEF4] px-8 flex items-center justify-between sticky top-0 z-30"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-[380px]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    className: "w-4 h-4 text-[#8A90A2] absolute left-3.5 top-1/2 -translate-y-1/2"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: function onChange(e) {
      return setSearchQuery(e.target.value);
    },
    placeholder: "Search rooms, amenities, or location...",
    className: "w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-full pl-10 pr-4 py-2 text-[13px] text-[#111827] placeholder-[#8A90A2] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
  }), searchQuery && /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setSearchQuery("");
    },
    className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-3.5 h-3.5"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("a", {
    href: "app.html",
    className: "hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#4F3FE0] bg-[#F4F2FF] border border-[#E3DEFF] hover:bg-[#EAE4FE] px-3 py-1.5 rounded-full transition-all",
    title: "Open Full Incubation OS App Shell"
  }, /*#__PURE__*/React.createElement("span", null, "\u26A1 Enterprise OS Shell"), /*#__PURE__*/React.createElement(Icon, {
    name: "externalLink",
    className: "w-3 h-3"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-full px-3.5 py-1.5 cursor-pointer hover:border-[#4F3FE0]/40 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mapPin",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[12.5px] font-semibold text-[#111827]"
  }, "XYZ Technologies (STP-XYZ)"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    className: "w-3.5 h-3.5 text-[#8A90A2]"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return showToast("Notifications: 2 pending requests");
    },
    className: "w-9 h-9 rounded-full bg-[#F6F7FB] border border-[#ECEEF4] flex items-center justify-center relative hover:bg-gray-100 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    className: "w-4 h-4 text-[#374151]"
  }), /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 border-2 border-white"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 pl-2 cursor-pointer",
    onClick: function onClick() {
      return navigateTo("Settings");
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    alt: "Alex Morgan",
    className: "w-9 h-9 rounded-full object-cover ring-2 ring-[#4F3FE0]/20"
  }), /*#__PURE__*/React.createElement("div", {
    className: "leading-tight text-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[13px] font-bold text-[#111827]"
  }, "Alex Morgan"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-medium text-[#8A90A2]"
  }, "Co-Founder")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    className: "w-3.5 h-3.5 text-[#8A90A2] ml-0.5"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 p-8 max-w-[1600px] w-full mx-auto"
  }, activeNav === "Dashboard" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-soft flex items-center min-h-[200px] max-h-[230px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[#F6F4FF]/75 to-transparent z-10 w-[65%]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 top-0 bottom-0 w-[55%] h-full z-0 overflow-hidden"
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/rooms/banner-hero.jpg",
    onError: function onError(e) {
      e.target.onerror = null;
      e.target.src = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80";
    },
    alt: "NEXUS HUB Modern Meeting Space",
    className: "w-full h-full object-cover object-center"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-r from-[#F6F4FF]/60 via-transparent to-black/10"
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative z-20 p-8 max-w-[580px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEBFF] text-[#4F3FE0] text-xs font-bold mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-[#4F3FE0] animate-pulse"
  }), /*#__PURE__*/React.createElement("span", null, "Sat, 31 Oct 2026 \u2022 XYZ Technologies")), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl lg:text-3xl font-black text-[#111827] tracking-tight"
  }, getGreeting(), ", Alex!"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed"
  }, "Here's what's happening at ", /*#__PURE__*/React.createElement("strong", null, "XYZ Technologies"), " today."), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return navigateTo("Meeting Rooms");
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 hover:shadow-md"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold"
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Reserve Space")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return navigateTo("Calendar");
    },
    className: "bg-white/90 backdrop-blur-xs border border-[#ECEEF4] text-[#374151] hover:text-[#4F3FE0] hover:bg-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
  }, "View Calendar")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("My Bookings");
    },
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[#8A90A2]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-[#64748B]"
  }, "Upcoming Meetings"), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center group-hover:scale-105 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-5 h-5 text-[#6E42E5]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-3"
  }, upcomingBookings.length, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
  }, "100% Confirmed")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-3 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#374151] font-medium"
  }, "Next: Today at 03:00 PM"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform"
  }, "My Bookings \u2192"))), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("Meeting Rooms");
    },
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[#8A90A2]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-[#64748B]"
  }, "Available Rooms"), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "building",
    className: "w-5 h-5 text-emerald-600"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#059669] mt-3"
  }, "5 ", /*#__PURE__*/React.createElement("span", {
    className: "text-base text-[#8A90A2] font-semibold"
  }, "/ 6"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#059669] ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
  }, "83% Ready")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-3 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#374151] font-medium"
  }, "Open right now"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform"
  }, "Book Room \u2192"))), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("Billing & Credits");
    },
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[#8A90A2]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-[#64748B]"
  }, "Remaining Credits"), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "creditCard",
    className: "w-5 h-5 text-blue-600"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#2563eb] mt-3"
  }, "80 ", /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-semibold text-[#8A90A2]"
  }, "/ 120 cr")), /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-[#ECEEF4] rounded-full h-1.5 mt-2 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#4F3FE0] h-full rounded-full",
    style: {
      width: "66%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#374151] font-medium"
  }, "Renews in 24 hours"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform"
  }, "Billing \u2192"))), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("My Bookings");
    },
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[#8A90A2]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-[#64748B]"
  }, "Pending Requests"), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-5 h-5 text-amber-600"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-3"
  }, "0"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-3 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#374151] font-medium"
  }, "All approved \u2713"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform"
  }, "Review \u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-7 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "\u26A1"), " Quick Actions"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Direct shortcuts to frequent meeting and facility tasks")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#ECEEF4]"
  }, "Shortcuts")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Meeting Rooms");
    },
    className: "flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#F3EFFE] hover:border-[#6E42E5]/30 hover:shadow-xs transition-all text-left group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-10 h-10 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-5 h-5 text-[#6E42E5]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827]"
  }, "Book a Room"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#8A90A2]"
  }, "Meeting Rooms & Pods"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] group-hover:text-[#4F3FE0] group-hover:translate-x-1 transition-all text-sm font-bold"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("My Bookings");
    },
    className: "flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEF5FF] hover:border-[#2B71FF]/30 hover:shadow-xs transition-all text-left group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-10 h-10 rounded-xl bg-blue-50 text-[#2B71FF] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bookmark",
    className: "w-5 h-5 text-[#2B71FF]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827]"
  }, "My Bookings"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#8A90A2]"
  }, "Active reservations"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] group-hover:text-[#4F3FE0] group-hover:translate-x-1 transition-all text-sm font-bold"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Calendar");
    },
    className: "flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEFAF3] hover:border-[#12A150]/30 hover:shadow-xs transition-all text-left group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendarDays",
    className: "w-5 h-5 text-emerald-600"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827]"
  }, "Open Calendar"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#8A90A2]"
  }, "Full Timeline View"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] group-hover:text-[#4F3FE0] group-hover:translate-x-1 transition-all text-sm font-bold"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Visitors");
    },
    className: "flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#FFF5EC] hover:border-[#F36B20]/30 hover:shadow-xs transition-all text-left group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "userPlus",
    className: "w-5 h-5 text-orange-600"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827]"
  }, "Invite Guests"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#8A90A2]"
  }, "Visitor Gate Pass"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] group-hover:text-[#4F3FE0] group-hover:translate-x-1 transition-all text-sm font-bold"
  }, "\u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFE2"), " Venture Facilities Overview"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Assigned physical space and operational amenities")), /*#__PURE__*/React.createElement("span", {
    onClick: function onClick() {
      return navigateTo("Workspace & Desks");
    },
    className: "text-xs font-bold text-[#4F3FE0] hover:underline cursor-pointer"
  }, "Manage Space \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("Members");
    },
    className: "p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl cursor-pointer hover:border-[#4F3FE0]/30 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-indigo-50 text-[#4F3FE0] flex items-center justify-center mb-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider"
  }, "Active Team"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#111827] mt-0.5"
  }, "8 Members"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] text-[#64748B] block mt-0.5"
  }, "Team Registered")), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("Workspace & Desks");
    },
    className: "p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl cursor-pointer hover:border-[#4F3FE0]/30 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-purple-50 text-[#6E42E5] flex items-center justify-center mb-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "building",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider"
  }, "Assigned Space"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#111827] mt-0.5"
  }, "Suite 401"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] text-[#64748B] block mt-0.5"
  }, "6 Desks (Fl 4)")), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("Billing & Credits");
    },
    className: "p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl cursor-pointer hover:border-[#4F3FE0]/30 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "creditCard",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider"
  }, "Invoices Due"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-emerald-600 mt-0.5"
  }, "All Settled \u2713"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] text-emerald-700 font-semibold block mt-0.5"
  }, "$0.00 Overdue")), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return navigateTo("Analytics");
    },
    className: "p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl cursor-pointer hover:border-[#4F3FE0]/30 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "crown",
    className: "w-4 h-4 text-amber-600"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider"
  }, "Next Milestone"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#4F3FE0] mt-0.5"
  }, "Beta Prototype"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] text-[#64748B] block mt-0.5"
  }, "Target: Nov 15"))))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-5 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDDD3\uFE0F"), " Today's Schedule"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Timeline of room allocations")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return navigateTo("Calendar");
    },
    className: "text-xs font-bold text-[#4F3FE0] hover:underline"
  }, "View Calendar \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECEEF4]"
  }, todaysSchedule.slice(0, 4).map(function (item, idx) {
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      onClick: function onClick() {
        return navigateTo("Meeting Rooms");
      },
      className: "relative flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:border-[#4F3FE0]/40 transition-all cursor-pointer group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "absolute -left-[21px] top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white ".concat(item.dotColor || 'bg-[#4F3FE0]', " shadow-xs")
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-bold text-[#4F3FE0]"
    }, item.time), /*#__PURE__*/React.createElement("span", {
      className: "bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full"
    }, "Confirmed")), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827] mt-1 group-hover:text-[#4F3FE0] transition-colors truncate"
    }, item.title), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#8A90A2] mt-0.5"
    }, item.room, " \u2022 \uD83D\uDC65 ", item.attendees, " pax")));
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 pt-3 border-t border-[#ECEEF4] flex items-center justify-between text-xs text-[#64748B]"
  }, /*#__PURE__*/React.createElement("span", null, "Need to book a new slot?"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return navigateTo("Meeting Rooms");
    },
    className: "bg-[#4F3FE0] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#4335C9] transition-all"
  }, "+ Reserve Space"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD52"), " Recent Activity"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Authorized venture event stream")), /*#__PURE__*/React.createElement("span", {
    onClick: function onClick() {
      return navigateTo("Analytics");
    },
    className: "text-xs font-bold text-[#4F3FE0] hover:underline cursor-pointer"
  }, "View All \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-[#ECEEF4]"
  }, DASHBOARD_ACTIVITIES.map(function (act) {
    return /*#__PURE__*/React.createElement("div", {
      key: act.id,
      className: "py-2.5 flex items-start justify-between gap-3 first:pt-1 last:pb-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-8 rounded-xl bg-[#F6F7FB] border border-[#ECEEF4] flex items-center justify-center text-[#4F3FE0] flex-shrink-0 mt-0.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: act.icon,
      className: "w-4 h-4 text-[#4F3FE0]"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827]"
    }, act.title), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#64748B] mt-0.5"
    }, act.desc))), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-semibold text-[#8A90A2] whitespace-nowrap bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#ECEEF4]"
    }, act.time));
  })))))), activeNav === "Meeting Rooms" && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start animate-fadeIn"
  }, /*#__PURE__*/React.createElement("main", {
    className: "space-y-6 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-soft flex items-center min-h-[220px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-r from-[#EAE6FF] via-[#F4F2FF] to-transparent z-10 w-[60%]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 top-0 bottom-0 w-[55%] h-full z-0 overflow-hidden"
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/rooms/banner-hero.jpg",
    onError: function onError(e) {
      e.target.onerror = null;
      e.target.src = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80";
    },
    alt: "Modern Boardroom",
    className: "w-full h-full object-cover object-center"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-r from-[#F4F2FF] via-transparent to-black/10"
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative z-20 p-8 max-w-[560px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-xs font-bold text-[#4F3FE0] uppercase tracking-wider mb-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bolt",
    className: "w-3.5 h-3.5 text-[#4F3FE0]",
    strokeWidth: 2.5
  }), /*#__PURE__*/React.createElement("span", null, "NEXUS HUB")), /*#__PURE__*/React.createElement("h2", {
    className: "text-[34px] xl:text-[38px] font-black text-[#111827] leading-[1.12] tracking-tight"
  }, "Book the right space ", /*#__PURE__*/React.createElement("br", null), "for every idea"), /*#__PURE__*/React.createElement("p", {
    className: "text-[13px] text-[#374151] font-medium mt-2 max-w-[460px]"
  }, "Modern meeting rooms for productive discussions, workshops and client calls."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2 mt-4 pt-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-500"
  }), "Instant Booking"), /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-blue-500"
  }), "Real-time Availability"), /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-amber-500"
  }), "Flexible Durations"), /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-indigo-500"
  }), "Integrated Calendar")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1.3fr_1fr_auto] gap-3 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1"
  }, "Date"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#4F3FE0]/50 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-4 h-4 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[13px] font-semibold text-[#111827] whitespace-nowrap"
  }, selectedDate), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    className: "w-3.5 h-3.5 text-[#8A90A2] ml-auto"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1"
  }, "Time"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#4F3FE0]/50 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-4 h-4 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[13px] font-semibold text-[#111827] whitespace-nowrap"
  }, selectedTime), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    className: "w-3.5 h-3.5 text-[#8A90A2] ml-auto"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1"
  }, "People"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#4F3FE0]/50 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    className: "w-4 h-4 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("select", {
    value: selectedPeople,
    onChange: function onChange(e) {
      return setSelectedPeople(Number(e.target.value));
    },
    className: "bg-transparent text-[13px] font-semibold text-[#111827] outline-none cursor-pointer w-full"
  }, /*#__PURE__*/React.createElement("option", {
    value: 2
  }, "2 people"), /*#__PURE__*/React.createElement("option", {
    value: 4
  }, "4 people"), /*#__PURE__*/React.createElement("option", {
    value: 6
  }, "6 people"), /*#__PURE__*/React.createElement("option", {
    value: 8
  }, "8 people"), /*#__PURE__*/React.createElement("option", {
    value: 10
  }, "10 people"), /*#__PURE__*/React.createElement("option", {
    value: 20
  }, "20+ people")))), /*#__PURE__*/React.createElement("div", {
    className: "self-end pt-4 sm:pt-0"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return showToast("\uD83D\uDD0D Filtered rooms with capacity >= ".concat(selectedPeople));
    },
    className: "w-full bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-7 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
  }, /*#__PURE__*/React.createElement("span", null, "Search Rooms")))), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 border-t border-[#ECEEF4] flex items-center justify-between flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center flex-wrap gap-1.5"
  }, ROOM_TYPES.map(function (type) {
    return /*#__PURE__*/React.createElement("button", {
      key: type,
      type: "button",
      onClick: function onClick() {
        return setSelectedType(type);
      },
      className: "px-3 py-1.5 rounded-full text-xs font-semibold transition-all ".concat(selectedType === type ? "bg-[#4F3FE0] text-white shadow-sm" : "bg-[#F6F7FB] hover:bg-gray-200 text-[#374151]")
    }, type);
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return showToast("Advanced filters: Price range & availability applied");
    },
    className: "inline-flex items-center gap-1.5 border border-[#4F3FE0] text-[#4F3FE0] hover:bg-[#F4F2FF] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "More Filters"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center flex-wrap gap-2 pt-1"
  }, AMENITIES_LIST.map(function (amenity) {
    var isSelected = selectedAmenities.includes(amenity.name);
    return /*#__PURE__*/React.createElement("button", {
      key: amenity.name,
      type: "button",
      onClick: function onClick() {
        return toggleAmenity(amenity.name);
      },
      className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border transition-all ".concat(isSelected ? "bg-[#EEEBFF] border-[#4F3FE0] text-[#4F3FE0] font-semibold" : "bg-white border-[#ECEEF4] text-[#374151] hover:border-gray-300")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: amenity.icon,
      className: "w-3.5 h-3.5 ".concat(isSelected ? "text-[#4F3FE0]" : "text-[#8A90A2]")
    }), /*#__PURE__*/React.createElement("span", null, amenity.name));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-black text-[#111827]"
  }, "Available Rooms"), /*#__PURE__*/React.createElement("span", {
    className: "bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200"
  }, filteredRooms.length, " rooms available")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center bg-white border border-[#ECEEF4] p-1 rounded-xl shadow-xs"
  }, ["Cards", "List", "Calendar"].map(function (v) {
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      type: "button",
      onClick: function onClick() {
        return setViewMode(v);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ".concat(viewMode === v ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, /*#__PURE__*/React.createElement("span", null, v));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
  }, filteredRooms.map(function (room) {
    var isFav = favorites.has(room.id);
    var isAvailable = room.status === "Available";
    return /*#__PURE__*/React.createElement("div", {
      key: room.id,
      className: "bg-white border border-[#ECEEF4] rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative aspect-[16/9] w-full overflow-hidden bg-gray-100"
    }, /*#__PURE__*/React.createElement("img", {
      src: room.image,
      onError: function onError(e) {
        e.target.onerror = null;
        e.target.src = room.fallbackImage;
      },
      alt: room.name,
      className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute top-3 left-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md ".concat(isAvailable ? "bg-[#16A34A]" : "bg-[#F97316]")
    }, room.status)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick(e) {
        return toggleFavorite(room.id, e);
      },
      className: "w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center absolute top-3 right-3 hover:scale-110 active:scale-95 transition-all"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: isFav ? "heartFilled" : "heart",
      className: "w-4 h-4 ".concat(isFav ? "text-[#EF4444]" : "text-[#8A90A2]"),
      strokeWidth: 2
    }))), /*#__PURE__*/React.createElement("div", {
      className: "p-4 flex-1 flex flex-col justify-between"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-[15px] text-[#111827] cursor-pointer hover:text-[#4F3FE0] transition-colors flex items-center justify-between",
      onClick: function onClick() {
        return openBookingDrawer(room);
      }
    }, /*#__PURE__*/React.createElement("span", null, room.name), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-semibold text-[#4F3FE0] bg-[#F4F2FF] px-2 py-0.5 rounded-full border border-[#E0D8FF]"
    }, "Quick Book \u2197")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 text-xs text-[#64748B] font-medium mt-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "users",
      className: "w-3.5 h-3.5 text-[#8A90A2]"
    }), /*#__PURE__*/React.createElement("span", null, room.capacity, " people"), /*#__PURE__*/React.createElement("span", {
      className: "mx-1"
    }, "\u2022"), /*#__PURE__*/React.createElement("span", {
      className: "text-[#4F3FE0] font-semibold"
    }, room.rate))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between pt-3 mt-3 border-t border-[#ECEEF4]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 text-[#8A90A2]"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "monitor",
      className: "w-4 h-4 hover:text-[#111827]"
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "video",
      className: "w-4 h-4 hover:text-[#111827]"
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "mic",
      className: "w-4 h-4 hover:text-[#111827]"
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "wifi",
      className: "w-4 h-4 hover:text-[#111827]"
    })), isAvailable ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return openBookingDrawer(room);
      },
      className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
    }, "Book Now") : /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return openBookingDrawer(room);
      },
      className: "border border-[#ECEEF4] hover:bg-gray-50 text-[#374151] px-4 py-2 rounded-xl text-xs font-semibold transition-all"
    }, "View Schedule"))));
  }))), /*#__PURE__*/React.createElement("aside", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-[13px] font-bold text-[#111827] mb-3"
  }, "Quick Actions"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2 text-center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return openBookingDrawer(rooms[0]);
    },
    className: "bg-[#F3EFFE] hover:bg-[#EAE4FE] text-[#6E42E5] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-5 h-5 text-[#6E42E5] group-hover:scale-110 transition-transform"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] font-bold leading-tight"
  }, "Book a Room")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("My Bookings");
    },
    className: "bg-[#EEF5FF] hover:bg-[#DFEDFF] text-[#2B71FF] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fileText",
    className: "w-5 h-5 text-[#2B71FF] group-hover:scale-110 transition-transform"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] font-bold leading-tight"
  }, "My Bookings")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return showToast("Recurring scheduler activated");
    },
    className: "bg-[#EEFAF3] hover:bg-[#DEFAEA] text-[#12A150] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "repeat",
    className: "w-5 h-5 text-[#12A150] group-hover:scale-110 transition-transform"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] font-bold leading-tight"
  }, "Recurring")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Visitors");
    },
    className: "bg-[#FFF5EC] hover:bg-[#FFE8D5] text-[#F36B20] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "userPlus",
    className: "w-5 h-5 text-[#F36B20] group-hover:scale-110 transition-transform"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10.5px] font-bold leading-tight"
  }, "Invite Guests")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-[13px] font-bold text-[#111827]"
  }, "Today's Schedule"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Calendar");
    },
    className: "text-xs font-semibold text-[#4F3FE0] hover:underline"
  }, "View Calendar")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, todaysSchedule.map(function (item, idx) {
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "flex items-start gap-2.5 text-xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-[84px] text-[10.5px] font-semibold text-[#8A90A2] pt-1 whitespace-nowrap leading-tight"
    }, item.time.replace("–", "\n–")), /*#__PURE__*/React.createElement("div", {
      className: "pt-2 flex flex-col items-center"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full ".concat(item.dotColor, " ring-4 ring-white shadow-xs")
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 bg-[#F8FAFC] border border-[#ECEEF4] ".concat(item.tintColor, " rounded-xl p-2.5")
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#111827] text-[12px] truncate"
    }, item.title), /*#__PURE__*/React.createElement(Icon, {
      name: "moreHorizontal",
      className: "w-3.5 h-3.5 text-[#8A90A2]"
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[11px] text-[#64748B] mt-1"
    }, /*#__PURE__*/React.createElement("span", null, item.room), /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1 font-medium"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "users",
      className: "w-3 h-3 text-[#8A90A2]"
    }), item.attendees))));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-[13px] font-bold text-[#111827]"
  }, "My Upcoming Bookings"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Bookings");
    },
    className: "text-xs font-semibold text-[#4F3FE0] hover:underline"
  }, "View All")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, upcomingBookings.map(function (bkg) {
    return /*#__PURE__*/React.createElement("div", {
      key: bkg.id,
      className: "flex items-center justify-between bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-2.5 hover:border-gray-300 transition-all text-xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5 min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-left leading-tight w-[58px] flex-shrink-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-bold text-[#111827] text-[11.5px]"
    }, bkg.date), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2]"
    }, bkg.time)), /*#__PURE__*/React.createElement("div", {
      className: "w-1 h-8 rounded-full ".concat(bkg.barColor, " flex-shrink-0")
    }), /*#__PURE__*/React.createElement("div", {
      className: "truncate"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-bold text-[#111827] text-[12px] truncate"
    }, bkg.title), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#64748B] truncate flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", null, bkg.room), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC65 ", bkg.attendees)))), /*#__PURE__*/React.createElement("span", {
      className: "px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0 ".concat(bkg.statusColor)
    }, bkg.status));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-[13px] font-bold text-[#111827]"
  }, "Usage & Credits"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
  }, "2 hrs free remaining")), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-2 bg-[#E4DEFF] rounded-full overflow-hidden mt-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-[#4F3FE0] rounded-full w-[80%]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs mt-2 text-[#64748B]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#111827]"
  }, "8 / 10 hours used"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return navigateTo("Billing & Credits");
    },
    className: "text-xs font-semibold text-[#4F3FE0] hover:underline"
  }, "View Details"))))), (activeNav === "My Bookings" || activeNav === "Bookings" || activeNav === "My Reservations") && function () {
    // Calculate dynamic KPI counts from state
    var totalCount = upcomingBookings.length;
    var confirmedCount = upcomingBookings.filter(function (b) {
      return b.status === "Confirmed";
    }).length;
    var pendingCount = upcomingBookings.filter(function (b) {
      return b.status === "Pending";
    }).length;
    var cancelledCount = upcomingBookings.filter(function (b) {
      return b.status === "Cancelled";
    }).length;

    // Dynamic filtering logic
    var filteredBookings = upcomingBookings.filter(function (bkg) {
      if (bookingsFilterTab !== "All Bookings" && bkg.status !== bookingsFilterTab) {
        return false;
      }
      if (bookingsSearchQuery.trim()) {
        var q = bookingsSearchQuery.toLowerCase();
        var matchTitle = (bkg.title || "").toLowerCase().includes(q);
        var matchRoom = (bkg.room || "").toLowerCase().includes(q);
        var matchResId = (bkg.resId || "").toLowerCase().includes(q);
        if (!matchTitle && !matchRoom && !matchResId) return false;
      }
      if (bookingsRoomFilter !== "All Rooms" && bkg.room !== bookingsRoomFilter) {
        return false;
      }
      if (bookingsDateFilter === "Today" && bkg.date !== "Today") return false;
      if (bookingsDateFilter === "Upcoming" && (bkg.status === "Cancelled" || bkg.status === "Completed")) return false;
      if (bookingsDateFilter === "Past" && bkg.status !== "Completed" && bkg.status !== "Cancelled") return false;
      return true;
    });
    var isFilterActive = bookingsSearchQuery || bookingsRoomFilter !== "All Rooms" || bookingsDateFilter !== "All Dates" || bookingsFilterTab !== "All Bookings";
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-6 animate-fadeIn"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-soft flex items-center min-h-[150px] sm:min-h-[170px] max-h-[190px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[#F6F4FF]/75 to-transparent z-10 w-full sm:w-[65%]"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute right-0 top-0 bottom-0 w-full sm:w-[50%] h-full z-0 overflow-hidden"
    }, /*#__PURE__*/React.createElement("img", {
      src: "assets/rooms/banner-hero.jpg",
      onError: function onError(e) {
        e.target.onerror = null;
        e.target.src = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80";
      },
      alt: "NEXUS HUB Modern Meeting Space",
      className: "w-full h-full object-cover object-center"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 bg-gradient-to-r from-[#F6F4FF]/60 via-transparent to-black/10"
    })), /*#__PURE__*/React.createElement("div", {
      className: "relative z-20 p-6 sm:p-7 max-w-[580px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEBFF] text-[#4F3FE0] text-[11px] font-bold mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-[#4F3FE0] animate-pulse"
    }), /*#__PURE__*/React.createElement("span", null, "RESERVATION COMMAND CENTER \u2022 XYZ TECHNOLOGIES")), /*#__PURE__*/React.createElement("h2", {
      className: "text-2xl sm:text-3xl font-black text-[#111827] tracking-tight"
    }, "My Bookings & Reservations"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed"
    }, "Manage, track and modify your meeting room bookings all in one place."), /*#__PURE__*/React.createElement("div", {
      className: "mt-3.5"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return navigateTo("Meeting Rooms");
      },
      className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-bold"
    }, "+"), /*#__PURE__*/React.createElement("span", null, "Book a Meeting Room"))))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      onClick: function onClick() {
        return setBookingsFilterTab("All Bookings");
      },
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[#8A90A2]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]"
    }, "Total Bookings"), /*#__PURE__*/React.createElement("div", {
      className: "w-9 h-9 rounded-xl bg-purple-50 text-[#4F3FE0] flex items-center justify-center group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      className: "w-5 h-5 text-[#4F3FE0]"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "text-3xl font-black text-[#111827] mt-2"
    }, totalCount), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#4F3FE0]"
    }), /*#__PURE__*/React.createElement("span", null, "All scheduled sessions"))), /*#__PURE__*/React.createElement("div", {
      onClick: function onClick() {
        return setBookingsFilterTab("Confirmed");
      },
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[#8A90A2]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]"
    }, "Confirmed"), /*#__PURE__*/React.createElement("div", {
      className: "w-9 h-9 rounded-xl bg-emerald-50 text-[#16A66A] flex items-center justify-center group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "checkCircle",
      className: "w-5 h-5 text-[#16A66A]"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "text-3xl font-black text-[#16A66A] mt-2"
    }, confirmedCount), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#16A66A]"
    }), /*#__PURE__*/React.createElement("span", null, "Guaranteed active slots"))), /*#__PURE__*/React.createElement("div", {
      onClick: function onClick() {
        return setBookingsFilterTab("Pending");
      },
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[#8A90A2]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]"
    }, "Pending"), /*#__PURE__*/React.createElement("div", {
      className: "w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      className: "w-5 h-5 text-[#F59E0B]"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "text-3xl font-black text-[#F59E0B] mt-2"
    }, pendingCount), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#F59E0B]"
    }), /*#__PURE__*/React.createElement("span", null, "Awaiting admin review"))), /*#__PURE__*/React.createElement("div", {
      onClick: function onClick() {
        return setBookingsFilterTab("Cancelled");
      },
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[#8A90A2]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]"
    }, "Cancelled"), /*#__PURE__*/React.createElement("div", {
      className: "w-9 h-9 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "xCircle",
      className: "w-5 h-5 text-[#EF4444]"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "text-3xl font-black text-[#EF4444] mt-2"
    }, cancelledCount), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-[#EF4444]"
    }), /*#__PURE__*/React.createElement("span", null, "Released & refunded")))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between flex-wrap gap-3 pt-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 overflow-x-auto pb-1 max-w-full"
    }, ["All Bookings", "Confirmed", "Pending", "Cancelled", "Completed"].map(function (tab) {
      var isActive = bookingsFilterTab === tab;
      return /*#__PURE__*/React.createElement("button", {
        key: tab,
        onClick: function onClick() {
          return setBookingsFilterTab(tab);
        },
        className: "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ".concat(isActive ? "bg-[#4F3FE0] text-white shadow-xs" : "bg-white border border-[#ECEEF4] text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]")
      }, /*#__PURE__*/React.createElement("span", null, tab), /*#__PURE__*/React.createElement("span", {
        className: "ml-2 text-[10.5px] px-1.5 py-0.2 rounded-full font-extrabold ".concat(isActive ? "bg-white/20 text-white" : "bg-gray-100 text-[#64748B]")
      }, tab === "All Bookings" ? totalCount : upcomingBookings.filter(function (b) {
        return b.status === tab;
      }).length));
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-semibold text-[#8A90A2]"
    }, "Showing ", /*#__PURE__*/React.createElement("strong", {
      className: "text-[#111827]"
    }, filteredBookings.length), " of ", totalCount, " reservations")), /*#__PURE__*/React.createElement("div", {
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft flex items-center justify-between flex-wrap gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3 flex-1 min-w-[260px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative flex-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      className: "w-4 h-4 text-[#8A90A2] absolute left-3.5 top-1/2 -translate-y-1/2"
    }), /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: bookingsSearchQuery,
      onChange: function onChange(e) {
        return setBookingsSearchQuery(e.target.value);
      },
      placeholder: "Search by meeting title, room, or #RES ID...",
      className: "w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl pl-10 pr-4 py-2 text-xs text-[#111827] placeholder-[#8A90A2] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
    }), bookingsSearchQuery && /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setBookingsSearchQuery("");
      },
      className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      className: "w-3.5 h-3.5"
    })))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5 flex-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3 py-1.5 text-xs text-[#374151]"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      className: "w-3.5 h-3.5 text-[#8A90A2]"
    }), /*#__PURE__*/React.createElement("select", {
      value: bookingsDateFilter,
      onChange: function onChange(e) {
        return setBookingsDateFilter(e.target.value);
      },
      className: "bg-transparent border-none text-xs font-semibold text-[#374151] focus:outline-none cursor-pointer"
    }, /*#__PURE__*/React.createElement("option", {
      value: "All Dates"
    }, "All Dates"), /*#__PURE__*/React.createElement("option", {
      value: "Today"
    }, "Today Only"), /*#__PURE__*/React.createElement("option", {
      value: "Upcoming"
    }, "Upcoming Only"), /*#__PURE__*/React.createElement("option", {
      value: "Past"
    }, "Past / Archived"))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3 py-1.5 text-xs text-[#374151]"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "building",
      className: "w-3.5 h-3.5 text-[#8A90A2]"
    }), /*#__PURE__*/React.createElement("select", {
      value: bookingsRoomFilter,
      onChange: function onChange(e) {
        return setBookingsRoomFilter(e.target.value);
      },
      className: "bg-transparent border-none text-xs font-semibold text-[#374151] focus:outline-none cursor-pointer"
    }, /*#__PURE__*/React.createElement("option", {
      value: "All Rooms"
    }, "All Rooms"), rooms.map(function (r) {
      return /*#__PURE__*/React.createElement("option", {
        key: r.id,
        value: r.name
      }, r.name);
    }))), isFilterActive && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        setBookingsSearchQuery("");
        setBookingsRoomFilter("All Rooms");
        setBookingsDateFilter("All Dates");
        setBookingsFilterTab("All Bookings");
      },
      className: "text-xs font-bold text-[#EF4444] hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-all flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      className: "w-3 h-3"
    }), /*#__PURE__*/React.createElement("span", null, "Clear Filters")))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lg:col-span-8 space-y-3.5"
    }, filteredBookings.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-12 text-center shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      className: "w-7 h-7 text-gray-400"
    })), /*#__PURE__*/React.createElement("h4", {
      className: "text-base font-bold text-[#111827]"
    }, "No reservations match your filters"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-[#8A90A2] mt-1 max-w-sm mx-auto"
    }, "Try resetting your search query or selecting a different status tab."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        setBookingsSearchQuery("");
        setBookingsRoomFilter("All Rooms");
        setBookingsDateFilter("All Dates");
        setBookingsFilterTab("All Bookings");
      },
      className: "mt-4 px-4 py-2 bg-[#4F3FE0] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#4335C9]"
    }, "Reset All Filters")) : filteredBookings.map(function (bkg) {
      var isCancelled = bkg.status === "Cancelled";
      var isCompleted = bkg.status === "Completed";
      var canModify = !isCancelled && !isCompleted;
      return /*#__PURE__*/React.createElement("div", {
        key: bkg.id,
        className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 sm:p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-3.5 flex-shrink-0"
      }, /*#__PURE__*/React.createElement("div", {
        className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-2.5 py-2 text-center min-w-[54px] flex flex-col items-center justify-center flex-shrink-0"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-lg font-black text-[#111827] leading-none"
      }, bkg.day || "30"), /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] font-extrabold text-[#4F3FE0] tracking-wider uppercase mt-1 leading-none"
      }, bkg.month || "OCT")), /*#__PURE__*/React.createElement("div", {
        onClick: function onClick() {
          return setDetailsModalBooking(bkg);
        },
        className: "w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#ECEEF4] relative flex-shrink-0 cursor-pointer group-hover:border-[#4F3FE0]/40 transition-all",
        title: "View room details for ".concat(bkg.room)
      }, /*#__PURE__*/React.createElement("img", {
        src: bkg.roomImage || "assets/rooms/mr-01-main.jpg",
        onError: function onError(e) {
          e.target.onerror = null;
          e.target.src = bkg.fallbackImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80";
        },
        alt: bkg.room,
        className: "w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300",
        loading: "lazy"
      }), /*#__PURE__*/React.createElement("div", {
        className: "absolute inset-0 bg-black/5 hover:bg-transparent transition-colors"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "flex-1 min-w-0"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2 flex-wrap"
      }, /*#__PURE__*/React.createElement("h4", {
        onClick: function onClick() {
          return setDetailsModalBooking(bkg);
        },
        className: "text-sm sm:text-[15px] font-black text-[#111827] truncate hover:text-[#4F3FE0] cursor-pointer"
      }, bkg.title), bkg.isRecurring && /*#__PURE__*/React.createElement("span", {
        className: "bg-[#F4F2FF] border border-[#E3DEFF] text-[#4F3FE0] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
      }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD04"), /*#__PURE__*/React.createElement("span", null, "Recurring"))), /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2.5 text-xs text-[#64748B] mt-1 flex-wrap"
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-bold text-[#374151] flex items-center gap-1"
      }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD"), /*#__PURE__*/React.createElement("span", null, bkg.room)), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", {
        className: "flex items-center gap-1"
      }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD52"), /*#__PURE__*/React.createElement("span", null, bkg.time)), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", {
        className: "flex items-center gap-1"
      }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC65"), /*#__PURE__*/React.createElement("span", null, bkg.attendees, " attendees")), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", {
        className: "text-[#4F3FE0] font-bold"
      }, "\uD83E\uDE99 ", bkg.credits || 18, " cr"), bkg.resId && /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] text-[#8A90A2] font-mono bg-gray-50 px-1.5 py-0.2 rounded border border-[#ECEEF4]"
      }, "#", bkg.resId)), bkg.purpose && /*#__PURE__*/React.createElement("p", {
        className: "text-[11px] text-[#8A90A2] mt-1 line-clamp-1 italic"
      }, "\u201C", bkg.purpose, "\u201D")), /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ECEEF4]"
      }, /*#__PURE__*/React.createElement("span", {
        className: "px-2.5 py-1 rounded-full text-[11px] font-bold ".concat(bkg.statusColor || 'bg-gray-100 text-gray-700')
      }, bkg.status), canModify ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: function onClick() {
          setRescheduleBooking(bkg);
          setRescheduleNewRoom(bkg.room);
          setRescheduleNewTime(bkg.time);
        },
        className: "border border-[#ECEEF4] hover:bg-[#F8FAFC] hover:border-[#4F3FE0]/40 text-[#374151] hover:text-[#4F3FE0] px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      }, "Reschedule"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: function onClick() {
          return setCancelModalBooking(bkg);
        },
        className: "text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
      }, "Cancel")) : /*#__PURE__*/React.createElement("span", {
        className: "text-[11px] font-medium text-[#8A90A2] italic px-1"
      }, isCancelled ? "Slot Released" : "Completed"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: function onClick() {
          return setDetailsModalBooking(bkg);
        },
        className: "text-xs font-bold text-[#4F3FE0] hover:bg-[#EEEBFF] px-2.5 py-1.5 rounded-xl transition-all",
        title: "View full booking details"
      }, "Details \u2192")));
    })), /*#__PURE__*/React.createElement("div", {
      className: "lg:col-span-4 space-y-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] mb-3"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-[#4F3FE0]"
    }), /*#__PURE__*/React.createElement("span", null, "Upcoming Schedule")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return navigateTo("Calendar");
      },
      className: "text-xs font-bold text-[#4F3FE0] hover:underline"
    }, "View Calendar \u2192")), /*#__PURE__*/React.createElement("div", {
      className: "relative pl-4 space-y-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#ECEEF4]"
    }), upcomingBookings.filter(function (b) {
      return b.status === "Confirmed" || b.status === "Pending";
    }).slice(0, 4).map(function (item) {
      return /*#__PURE__*/React.createElement("div", {
        key: item.id,
        className: "relative group cursor-pointer",
        onClick: function onClick() {
          return setDetailsModalBooking(item);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ".concat(item.status === 'Confirmed' ? 'bg-[#16A66A]' : 'bg-[#F59E0B]')
      }), /*#__PURE__*/React.createElement("div", {
        className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-3 hover:bg-white hover:border-[#4F3FE0]/30 hover:shadow-xs transition-all"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center justify-between text-[11px] mb-1"
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-bold text-[#4F3FE0]"
      }, item.date, " \u2022 ", item.time.split("–")[0].trim()), /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] font-bold px-1.5 py-0.2 rounded-full ".concat(item.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')
      }, item.status)), /*#__PURE__*/React.createElement("div", {
        className: "text-xs font-bold text-[#111827] truncate"
      }, item.title), /*#__PURE__*/React.createElement("div", {
        className: "text-[11px] text-[#8A90A2] mt-0.5 truncate flex items-center gap-1"
      }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD ", item.room), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC65 ", item.attendees))));
    }))), /*#__PURE__*/React.createElement("div", {
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "text-xs font-black uppercase tracking-wider text-[#111827] mb-3 flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-5 h-5 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center"
    }, "\u26A1"), /*#__PURE__*/React.createElement("span", null, "Quick Actions")), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-2.5"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return openBookingDrawer(rooms[0]);
      },
      className: "p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#F3EFFE] hover:border-[#6E42E5]/30 transition-all text-center group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-9 h-9 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      className: "w-4 h-4 text-[#6E42E5]"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827]"
    }, "Book a Room"), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2] mt-0.5"
    }, "6 Facilities")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return navigateTo("Calendar");
      },
      className: "p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEF5FF] hover:border-[#2B71FF]/30 transition-all text-center group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-9 h-9 rounded-xl bg-blue-50 text-[#2B71FF] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendarDays",
      className: "w-4 h-4 text-[#2B71FF]"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827]"
    }, "Open Calendar"), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2] mt-0.5"
    }, "Weekly Grid")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return navigateTo("Visitors");
      },
      className: "p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEFAF3] hover:border-[#12A150]/30 transition-all text-center group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "userPlus",
      className: "w-4 h-4 text-emerald-600"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827]"
    }, "Invite Guests"), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2] mt-0.5"
    }, "QR Gate Pass")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() {
        return navigateTo("Meeting Rooms");
      },
      className: "p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#FFF8EC] hover:border-[#F59E0B]/30 transition-all text-center group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      className: "w-4 h-4 text-amber-600"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827]"
    }, "Check Live"), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2] mt-0.5"
    }, "5/6 Available")))))));
  }(), activeNav === "Calendar" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Interactive Room Calendar"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Real-time room occupancy and timeline scheduling")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 bg-[#F8FAFC] border border-[#ECEEF4] p-1 rounded-xl"
  }, ["Day", "Week", "Month"].map(function (v) {
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: function onClick() {
        return setCalendarView(v);
      },
      className: "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(calendarView === v ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, v);
  }))), calendarView === "Day" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] flex-wrap gap-2 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-4 h-4 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "Monday, 2 November 2026 • Full Schedule")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-[11px] font-semibold text-[#8A90A2]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#4F3FE0]"
  }), " Reserved Meeting"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-emerald-500"
  }), " Open Slot (Click to Book)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-2 text-center font-bold text-xs text-[#64748B] pb-2"
  }, rooms.map(function (r) {
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      className: "truncate px-1 bg-[#F8FAFC] py-2 rounded-lg border border-[#ECEEF4]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-extrabold text-[#111827] truncate"
    }, r.name), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2] font-semibold mt-0.5"
    }, r.capacity, " Pax"));
  })), ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"].map(function (hour) {
    return /*#__PURE__*/React.createElement("div", {
      key: hour,
      className: "grid grid-cols-6 gap-2 items-center py-2.5 border-b border-gray-100 text-xs"
    }, rooms.map(function (r) {
      var isOccupied = (hour === "09:00 AM" && r.id === "mr-1") ||
                       (hour === "11:00 AM" && r.id === "mr-2") ||
                       (hour === "03:00 PM" && r.id === "mr-4") ||
                       (hour === "04:00 PM" && r.id === "mr-1");
      return isOccupied ? /*#__PURE__*/React.createElement("div", {
        key: r.id,
        className: "bg-[#EEEBFF] border border-[#D5CCFF] text-[#4F3FE0] p-2.5 rounded-xl text-center font-bold truncate shadow-2xs"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[11px]"
      }, "Occupied (", hour, ")"), /*#__PURE__*/React.createElement("div", {
        className: "text-[9.5px] font-semibold text-[#6D5CD6] truncate mt-0.5"
      }, r.id === "mr-1" ? "Leadership Review" : r.id === "mr-2" ? "Investor Pitch" : "Sprint Planning")) : /*#__PURE__*/React.createElement("button", {
        key: r.id,
        onClick: function onClick() {
          openBookingModal(r);
        },
        className: "bg-[#F8FAFC] border border-dashed border-[#ECEEF4] hover:border-[#4F3FE0] hover:bg-[#F3EFFE] text-[#8A90A2] hover:text-[#4F3FE0] p-2.5 rounded-xl text-center font-medium transition-all group"
      }, /*#__PURE__*/React.createElement("span", {
        className: "group-hover:font-bold"
      }, "+ Open (", hour, ")"));
    }));
  })), calendarView === "Week" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827]"
  }, "Week of Nov 2 – Nov 8, 2026"), /*#__PURE__*/React.createElement("div", {
    className: "text-[#8A90A2]"
  }, "7 Active Bookings Across 6 Suites")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-3 text-center"
  }, [
    { day: "Mon", date: "Nov 2", count: 3, active: true },
    { day: "Tue", date: "Nov 3", count: 2, active: false },
    { day: "Wed", date: "Nov 4", count: 4, active: false },
    { day: "Thu", date: "Nov 5", count: 1, active: false },
    { day: "Fri", date: "Nov 6", count: 5, active: false },
    { day: "Sat", date: "Nov 7", count: 0, active: false },
    { day: "Sun", date: "Nov 8", count: 0, active: false }
  ].map(function (d) {
    return /*#__PURE__*/React.createElement("div", {
      key: d.day,
      className: "p-4 rounded-xl border transition-all ".concat(d.active ? "border-[#4F3FE0] bg-[#EEEBFF]" : "border-[#ECEEF4] bg-[#F8FAFC]")
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#8A90A2]"
    }, d.day), /*#__PURE__*/React.createElement("div", {
      className: "text-base font-black text-[#111827] mt-0.5"
    }, d.date), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0] mt-2"
    }, d.count, " bookings"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setCalendarView("Day");
      },
      className: "mt-3 w-full text-[11px] font-bold py-1.5 bg-white border border-[#ECEEF4] rounded-lg text-[#111827] hover:border-[#4F3FE0]"
    }, "View Day"));
  }))), calendarView === "Month" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] text-xs font-bold text-[#111827]"
  }, /*#__PURE__*/React.createElement("span", null, "November 2026"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2]"
  }, "30 Days • 18 Reserved Slots")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-2 text-center text-xs"
  }, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (h) {
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      className: "font-black text-[#8A90A2] py-2"
    }, h);
  }), Array.from({ length: 30 }, function (_, i) {
    var dayNum = i + 1;
    var hasBookings = [2, 3, 4, 6, 9, 11, 14, 18, 20, 25].includes(dayNum);
    return /*#__PURE__*/React.createElement("div", {
      key: dayNum,
      onClick: function onClick() {
        return setCalendarView("Day");
      },
      className: "p-2.5 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:border-[#4F3FE0] hover:bg-[#EEEBFF] cursor-pointer transition-all flex flex-col items-center justify-between min-h-[58px]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#111827]"
    }, dayNum), hasBookings && /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-[#4F3FE0]"
    }));
  })))), activeNav === "Billing & Credits" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-extrabold tracking-wider text-[#8A90A2] uppercase mb-1"
  }, "Billing & Credits"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl sm:text-3xl font-black text-[#111827] tracking-tight"
  }, "Billing & Meeting Room Credits"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs sm:text-sm text-[#64748B] mt-1"
  }, "Track quota, plans, invoices, and transaction activity")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-28 h-16 flex-shrink-0 hidden md:block"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 140 90",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: "w-full h-full drop-shadow-md"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "65",
    cy: "45",
    rx: "50",
    ry: "30",
    fill: "#C7D2FE",
    fillOpacity: "0.4",
    filter: "blur(14px)"
  }), /*#__PURE__*/React.createElement("g", {
    transform: "rotate(-7 55 42)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "15",
    y: "12",
    width: "82",
    height: "50",
    rx: "9",
    fill: "url(#cardGrad)"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "25",
    y: "24",
    width: "13",
    height: "10",
    rx: "2",
    fill: "#FCD34D"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "25",
    y1: "29",
    x2: "38",
    y2: "29",
    stroke: "#F59E0B",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "31.5",
    y1: "24",
    x2: "31.5",
    y2: "34",
    stroke: "#F59E0B",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "25",
    y: "44",
    width: "36",
    height: "4",
    rx: "2",
    fill: "white",
    fillOpacity: "0.85"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "80",
    cy: "44",
    r: "5.5",
    fill: "#F472B6",
    fillOpacity: "0.85"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "87",
    cy: "44",
    r: "5.5",
    fill: "#FBBF24",
    fillOpacity: "0.85"
  })), /*#__PURE__*/React.createElement("g", {
    transform: "translate(88, 40)"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "15",
    r: "13",
    fill: "#FBBF24",
    stroke: "#F59E0B",
    strokeWidth: "1.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "15",
    r: "9.5",
    fill: "#FDE68A"
  }), /*#__PURE__*/React.createElement("text", {
    x: "15",
    y: "19",
    fontSize: "11",
    fontWeight: "bold",
    textAnchor: "middle",
    fill: "#D97706"
  }, "\u20B9")), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "20",
    r: "2.5",
    fill: "#818CF8",
    fillOpacity: "0.8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "106",
    cy: "16",
    r: "2",
    fill: "#60A5FA",
    fillOpacity: "0.8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "98",
    cy: "74",
    r: "1.8",
    fill: "#FCD34D",
    fillOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "cardGrad",
    x1: "15",
    y1: "12",
    x2: "97",
    y2: "62",
    gradientUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("stop", {
    stopColor: "#6366F1"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "0.5",
    stopColor: "#4F46E5"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#3B82F6"
  }))))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setShowPurchaseCreditsModal(true);
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "+ Purchase Extra Credits")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-3 gap-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#F3EFFE] text-[#4F3FE0] flex items-center justify-center flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coins",
    className: "w-5 h-5 text-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-extrabold uppercase tracking-wider text-[#8A90A2]"
  }, "Remaining Balance"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl sm:text-3xl font-black text-[#111827] mt-0.5"
  }, "80 credits"))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    className: "w-4 h-4 text-[#A0AEC0]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-[#64748B] mt-4 font-medium"
  }, /*#__PURE__*/React.createElement("span", null, "Out of 120 credits total quota"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#4F3FE0]"
  }, "67% left")), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-2 bg-[#EEEBFF] rounded-full mt-2 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-gradient-to-r from-[#5937F5] to-[#4F3FE0] rounded-full w-[67%]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] font-medium text-[#8A90A2] pt-3 mt-3 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", null, "40 credits used"), /*#__PURE__*/React.createElement("span", null, "120 total"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-5 h-5 text-[#059669]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-extrabold uppercase tracking-wider text-[#8A90A2]"
  }, "Monthly Free Hours"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl sm:text-3xl font-black text-[#059669] mt-0.5"
  }, "2.0 hrs left"))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    className: "w-4 h-4 text-[#A0AEC0]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-[#64748B] mt-4 font-medium"
  }, /*#__PURE__*/React.createElement("span", null, "8 / 10 hours consumed"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#059669]"
  }, "20% left")), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-2 bg-[#E6F4EA] rounded-full mt-2 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full w-[20%]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] font-medium text-[#8A90A2] pt-3 mt-3 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", null, "8 hrs used"), /*#__PURE__*/React.createElement("span", null, "10 hrs total"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "crown",
    className: "w-5 h-5 text-[#D97706]",
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-extrabold uppercase tracking-wider text-[#8A90A2]"
  }, "Subscription Plan"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl sm:text-2xl font-black text-[#111827] mt-0.5"
  }, "Scale-up Venture"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-[#ECFDF5] text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200"
  }, "\u25CF ACTIVE"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    className: "w-4 h-4 text-[#A0AEC0]"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-3 font-medium"
  }, "Renews automatically on Nov 1, 2026")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-[#ECEEF4] text-[11px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[#374151]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9.5px] font-semibold text-[#8A90A2] uppercase"
  }, "Monthly"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#111827]"
  }, "10 free hrs"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[#374151]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9.5px] font-semibold text-[#8A90A2] uppercase"
  }, "Base quota"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#111827]"
  }, "120 credits"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[#374151]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\u2B50"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9.5px] font-semibold text-[#8A90A2] uppercase"
  }, "Extra credits"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-[#111827]"
  }, "\u20B9500 / 10 cr")))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-5 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-6 h-6 rounded-lg bg-purple-50 text-[#4F3FE0] flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "barChart",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("span", null, "Credit Usage This Month")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-[#374151] bg-[#F8FAFC] border border-[#ECEEF4] px-2.5 py-1 rounded-lg"
  }, "October 2026 \u25BE")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row items-center gap-6 my-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-36 h-36 flex items-center justify-center flex-shrink-0"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-full h-full transform -rotate-90",
    viewBox: "0 0 120 120"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "60",
    r: "48",
    stroke: "#EEEBFF",
    strokeWidth: "13",
    fill: "transparent"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "60",
    r: "48",
    stroke: "#4F3FE0",
    strokeWidth: "13",
    strokeDasharray: "301.59",
    strokeDashoffset: "202.06",
    strokeLinecap: "round",
    fill: "transparent",
    className: "transition-all duration-700 ease-out"
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex flex-col items-center justify-center text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl font-black text-[#111827] tracking-tight"
  }, "120"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold text-[#8A90A2]"
  }, "Total Credits"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 w-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 font-bold text-[#111827]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "40 credits used")), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-[#8A90A2]"
  }, "33%")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 font-bold text-[#111827]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#818CF8]"
  }), /*#__PURE__*/React.createElement("span", null, "80 credits remaining")), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-[#8A90A2]"
  }, "67%")))), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 bg-[#F5F3FF] border border-[#E0E7FF] rounded-xl p-3.5 flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-lg bg-indigo-100 text-[#4338CA] flex items-center justify-center flex-shrink-0 font-bold"
  }, "\uD83D\uDCC8"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#4338CA]"
  }, "You're on track!"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#6366F1] mt-0.5"
  }, "67% of your monthly quota is still available.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-6 h-6 rounded-lg bg-purple-50 text-[#4F3FE0] flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fileText",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("span", null, "Plan & Billing Details")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return showToast("Viewing full subscription tier specifications");
    },
    className: "text-xs font-bold text-[#4F3FE0] hover:underline"
  }, "View Plan \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-semibold text-[#8A90A2] uppercase flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC5"), " Next Renewal"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827] mt-1"
  }, "Nov 1, 2026"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-emerald-600 font-semibold mt-0.5"
  }, "\u25CF Auto-renew enabled")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-semibold text-[#8A90A2] uppercase flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC4"), " Last Invoice"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 mt-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#111827]"
  }, "INV-2026-1028"), /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded"
  }, "Paid")), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#8A90A2] mt-0.5"
  }, "28 Oct 2026")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-semibold text-[#8A90A2] uppercase flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDE99"), " Extra Credits Price"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827] mt-1"
  }, "\u20B9500 / 10 credits"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#8A90A2] mt-0.5"
  }, "Buy additional credits anytime"))))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-6 h-6 rounded-lg bg-purple-50 text-[#4F3FE0] flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bookmark",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("span", null, "Recent Credit Ledger")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return showToast("Opening full audit ledger with filter controls");
    },
    className: "text-xs font-bold text-[#4F3FE0] hover:underline"
  }, "View All \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-[#ECEEF4]"
  }, [{
    title: "Session in Collaboration Room",
    date: "Today, 03:30 PM",
    credits: "-18 credits",
    hours: "-1.5 hrs",
    iconType: "calendar",
    iconBg: "bg-blue-50 text-[#2563EB]"
  }, {
    title: "Client Meeting in Pitch Arena Nexus",
    date: "28 Oct 2026, 11:30 AM",
    credits: "-25 credits",
    hours: "-1.5 hrs",
    iconType: "users",
    iconBg: "bg-purple-50 text-[#6E42E5]"
  }, {
    title: "Monthly Incubator Quota Credited",
    date: "01 Oct 2026, 12:00 AM",
    credits: "+120 credits",
    hours: "+10.0 hrs",
    iconType: "gift",
    iconBg: "bg-emerald-50 text-[#059669]",
    isCredit: true
  }, {
    title: "Team Sync in Focus Room",
    date: "27 Oct 2026, 02:00 PM",
    credits: "-12 credits",
    hours: "-1.0 hrs",
    iconType: "calendar",
    iconBg: "bg-blue-50 text-[#2563EB]"
  }, {
    title: "Product Planning - Boardroom Alpha",
    date: "26 Oct 2026, 09:00 AM",
    credits: "-20 credits",
    hours: "-2.0 hrs",
    iconType: "users",
    iconBg: "bg-purple-50 text-[#6E42E5]"
  }].map(function (tx, idx) {
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded-xl transition-all"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ".concat(tx.iconBg)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: tx.iconType,
      className: "w-5 h-5"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#111827]"
    }, tx.title), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#8A90A2] mt-0.5"
    }, tx.date))), /*#__PURE__*/React.createElement("div", {
      className: "text-right"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold ".concat(tx.isCredit ? 'text-emerald-600 font-extrabold' : 'text-[#111827]')
    }, tx.credits), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] ".concat(tx.isCredit ? 'text-emerald-600 font-medium' : 'text-[#8A90A2]')
    }, tx.hours)));
  })))))), activeNav === "Analytics" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Meeting Space Insights & Analytics"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Utilization frequency, party density, peak hours, and incubator credit savings")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-[#F8FAFC] border border-[#ECEEF4] p-1 rounded-xl"
  }, ["This Month", "Last 7 Days", "Last 90 Days"].map(function (p) {
    return /*#__PURE__*/React.createElement("button", {
      key: p,
      onClick: function onClick() {
        return setAnalyticsPeriod(p);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(analyticsPeriod === p ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, p);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return showToast("Analytics summary report (CSV) exported successfully!");
    },
    className: "bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Export Report")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Total Booked Hours"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-2"
  }, "28 hrs"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 mt-1 block"
  }, "↑ 14% vs last month")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Favorite Room"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#4F3FE0] mt-2"
  }, "Boardroom Alpha"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "82% utilization rate")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Average Attendance"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-2"
  }, "5.8 pax"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "Healthy meeting density")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Credits Saved"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-emerald-600 mt-2"
  }, "₹14,500"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "Included with incubator pass"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Room Utilization Frequency"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Percentage of available operating hours booked")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, [
    { name: "Boardroom Alpha", pct: 82, hrs: "28 hrs", color: "bg-[#4F3FE0]" },
    { name: "Pitch Arena Nexus", pct: 68, hrs: "22 hrs", color: "bg-indigo-500" },
    { name: "Collaboration Room", pct: 55, hrs: "16 hrs", color: "bg-purple-500" },
    { name: "Focus Room", pct: 48, hrs: "14 hrs", color: "bg-blue-500" },
    { name: "Training Room", pct: 35, hrs: "10 hrs", color: "bg-emerald-500" },
    { name: "Creative Studio", pct: 28, hrs: "8 hrs", color: "bg-amber-500" }
  ].map(function (item) {
    return /*#__PURE__*/React.createElement("div", {
      key: item.name,
      className: "space-y-1.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between text-xs font-bold"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#111827]"
    }, item.name), /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2]"
    }, item.pct, "% (", item.hrs, ")")), /*#__PURE__*/React.createElement("div", {
      className: "w-full h-2.5 rounded-full bg-[#F1F3F9] overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full rounded-full ".concat(item.color),
      style: { width: "".concat(item.pct, "%") }
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Peak Meeting Hours & Distribution"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Hourly booking volume across the day (12-hour format)")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-5 gap-2 items-end h-40 pt-4"
  }, [
    { time: "09:00 AM", count: 18, pct: "75%" },
    { time: "11:00 AM", count: 24, pct: "100%" },
    { time: "01:00 PM", count: 12, pct: "50%" },
    { time: "03:00 PM", count: 22, pct: "92%" },
    { time: "05:00 PM", count: 14, pct: "58%" }
  ].map(function (slot) {
    return /*#__PURE__*/React.createElement("div", {
      key: slot.time,
      className: "flex flex-col items-center gap-1.5 h-full justify-end"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-black text-[#4F3FE0]"
    }, slot.count), /*#__PURE__*/React.createElement("div", {
      className: "w-full bg-[#EEEBFF] hover:bg-[#4F3FE0] transition-colors rounded-t-lg",
      style: { height: slot.pct }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold text-[#8A90A2] whitespace-nowrap mt-1"
    }, slot.time));
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-4 border-t border-[#ECEEF4] grid grid-cols-2 gap-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] text-[11px] font-bold"
  }, "Executive / Board"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#111827] mt-0.5"
  }, "42% of bookings")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] text-[11px] font-bold"
  }, "Sprint Syncs / Tech"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#111827] mt-0.5"
  }, "31% of bookings")))))), activeNav === "Workspace & Desks" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Workspace & Dedicated Pods"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Cyber City Hub • Ground Floor East Wing • Dedicated Incubator Zone")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold"
  }, "Allocated: Dedicated Pod #4"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return showToast("Floating desk reservation confirmed for today!");
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
  }, "+ Book Hot Desk"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#EEEBFF] border border-[#D5CCFF] rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-11 h-11 rounded-xl bg-[#4F3FE0] text-white flex items-center justify-center text-xl flex-shrink-0"
  }, "🏢"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-[#111827]"
  }, "XYZ Technologies Dedicated Workstation Quad"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#4F3FE0] font-semibold mt-0.5"
  }, "6 Dedicated Desks • 2 Floating Hot Desks • 24/7 Biometric Access • 1 Gbps Fiber"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, ["Ground Floor (East Wing)", "1st Floor (Open Zone)", "2nd Floor (Quiet Hub)"].map(function (floor) {
    return /*#__PURE__*/React.createElement("button", {
      key: floor,
      onClick: function onClick() {
        return setActiveDeskFloor(floor);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(activeDeskFloor === floor ? "bg-[#4F3FE0] text-white shadow-xs" : "bg-white/80 border border-[#ECEEF4] text-[#374151] hover:bg-white")
    }, floor);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Assigned Team Workstations (", activeDeskFloor, ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full"
  }, "6 / 6 Assigned & Active")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
  }, [
    { desk: "Desk 4A", user: "Alex Morgan", role: "CEO & Co-Founder", specs: "Standing Desk + Dual 4K Displays", status: "Active" },
    { desk: "Desk 4B", user: "Sarah Chen", role: "CTO & Co-Founder", specs: "Dual 4K Displays + Gigabit LAN", status: "Active" },
    { desk: "Desk 4C", user: "David Kim", role: "Head of Product", specs: "Ultrawide 34-inch Curved Monitor", status: "Active" },
    { desk: "Desk 4D", user: "Priya Patel", role: "Lead AI Engineer", specs: "High-Perf Workstation + Dual Display", status: "Active" },
    { desk: "Desk 4E", user: "Arjun Reddy", role: "Full-Stack Dev (Floating)", specs: "Hot Desk with USB-C Hub", status: "Floating" },
    { desk: "Desk 4F", user: "Sneha Joshi", role: "UI/UX Designer (Floating)", specs: "Hot Desk with Calibrated Monitor", status: "Floating" }
  ].map(function (d, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "p-4 bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl flex flex-col justify-between gap-3 hover:border-[#4F3FE0]/50 transition-all shadow-2xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-2xl"
    }, "🪑"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-sm text-[#111827]"
    }, d.desk), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0]"
    }, d.user))), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-black px-2 py-0.5 rounded-full ".concat(d.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200")
    }, d.status)), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#8A90A2] font-medium"
    }, d.specs), /*#__PURE__*/React.createElement("div", {
      className: "pt-2 border-t border-[#ECEEF4] flex items-center justify-between text-[11px]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#64748B] font-semibold"
    }, d.role), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("Workstation reallocation request logged.");
      },
      className: "text-[#4F3FE0] hover:underline font-bold"
    }, "Manage")));
  })))), activeNav === "Visitors" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Visitor Gate Passes & Invites"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Issue instant QR security credentials and track arriving guest founders")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-[#F8FAFC] border border-[#ECEEF4] p-1 rounded-xl"
  }, ["All Visitors", "Expected Today", "Checked In"].map(function (tab) {
    return /*#__PURE__*/React.createElement("button", {
      key: tab,
      onClick: function onClick() {
        return setVisitorsTab(tab);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(visitorsTab === tab ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, tab);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsVisitorModalOpen(true);
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold"
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Create Guest Pass")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Expected Today"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#111827] mt-1"
  }, "2 Visitors"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#4F3FE0] font-semibold mt-0.5 block"
  }, "Security desks notified")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Currently Checked In"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-emerald-600 mt-1"
  }, "1 Guest Active"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] font-semibold mt-0.5 block"
  }, "Meeting in Collaboration Room")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Monthly Passes Issued"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#111827] mt-1"
  }, "14 Passes"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-emerald-600 font-semibold mt-0.5 block"
  }, "Zero security incidents"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Guest Pass Directory & Status"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, visitorsList.filter(function (v) {
    if (visitorsTab === "Expected Today") return v.status === "Pass Issued";
    if (visitorsTab === "Checked In") return v.status === "Checked In";
    return true;
  }).map(function (v) {
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      className: "p-4 bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl flex items-center justify-between flex-wrap gap-3 text-xs hover:border-[#4F3FE0]/40 transition-all shadow-2xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-10 h-10 rounded-xl bg-[#EEEBFF] text-[#4F3FE0] font-black flex items-center justify-center text-sm flex-shrink-0"
    }, v.name.split(" ").map(function (n) { return n[0]; }).join("")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-sm text-[#111827]"
    }, v.name, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-semibold text-[#8A90A2] ml-2"
    }, "(", v.org, ")")), /*#__PURE__*/React.createElement("div", {
      className: "text-[#64748B] text-xs font-medium mt-0.5"
    }, "Host: ", /*#__PURE__*/React.createElement("strong", { className: "text-[#111827]" }, v.host), " • Session in ", /*#__PURE__*/React.createElement("strong", { className: "text-[#4F3FE0]" }, v.room), " at ", /*#__PURE__*/React.createElement("strong", null, v.time)))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "px-3 py-1 rounded-full font-bold text-xs ".concat(v.status === "Checked In" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : v.status === "Pass Issued" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-gray-100 text-gray-600 border border-gray-200")
    }, v.status), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        setVisitorsList(function (prev) {
          return prev.map(function (item) {
            return item.id === v.id ? Object.assign({}, item, { status: item.status === "Checked In" ? "Completed" : "Checked In" }) : item;
          });
        });
        showToast("Visitor status updated for ".concat(v.name));
      },
      className: "px-3 py-1 bg-white border border-[#ECEEF4] hover:border-[#4F3FE0] hover:text-[#4F3FE0] text-[#111827] text-xs font-bold rounded-lg transition-all"
    }, v.status === "Checked In" ? "Check Out" : "Check In"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("QR gate pass re-sent to ".concat(v.name));
      },
      className: "px-3 py-1 bg-[#EEEBFF] text-[#4F3FE0] text-xs font-bold rounded-lg hover:bg-[#E3DEFF] transition-all"
    }, "Resend QR")));
  }))), isVisitorModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, "Create Guest Gate Pass"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsVisitorModalOpen(false);
    },
    className: "text-[#8A90A2] hover:text-[#111827] font-bold"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 text-xs font-bold text-[#374151]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Visitor Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newVisitorData.name,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { name: e.target.value }));
    },
    placeholder: "e.g. Sridhar Vembu",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Company / Organization"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newVisitorData.org,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { org: e.target.value }));
    },
    placeholder: "e.g. Zoho Corporation",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Host Founder"), /*#__PURE__*/React.createElement("select", {
    value: newVisitorData.host,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { host: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["Alex Morgan", "Sarah Chen", "David Kim", "Priya Patel"].map(function (h) {
    return /*#__PURE__*/React.createElement("option", {
      key: h,
      value: h
    }, h);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Meeting Room"), /*#__PURE__*/React.createElement("select", {
    value: newVisitorData.room,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { room: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, rooms.map(function (r) {
    return /*#__PURE__*/React.createElement("option", {
      key: r.name,
      value: r.name
    }, r.name);
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Arrival Time (12-Hour AM/PM)"), /*#__PURE__*/React.createElement("select", {
    value: newVisitorData.time,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { time: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"].map(function (t) {
    return /*#__PURE__*/React.createElement("option", {
      key: t,
      value: t
    }, t);
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsVisitorModalOpen(false);
    },
    className: "px-4 py-2 border border-[#ECEEF4] rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (!newVisitorData.name.trim()) return showToast("Please enter visitor name");
      var newV = {
        id: "v-".concat(Date.now()),
        name: newVisitorData.name,
        org: newVisitorData.org || "External Partner",
        host: newVisitorData.host,
        room: newVisitorData.room,
        time: newVisitorData.time,
        status: "Pass Issued"
      };
      setVisitorsList(function (prev) {
        return [newV].concat(prev);
      });
      setIsVisitorModalOpen(false);
      setNewVisitorData({ name: "", org: "", host: "Alex Morgan", room: "Boardroom Alpha", time: "10:00 AM" });
      showToast("Security QR gate pass issued for ".concat(newV.name));
    },
    className: "px-4 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-xs"
  }, "Issue Security Pass"))))), activeNav === "Members" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Venture Team Directory"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "XYZ Technologies registered incubator founders, keyholders, and allocated credits")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    className: "w-3.5 h-3.5 text-[#8A90A2] absolute left-3 top-1/2 -translate-y-1/2"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: memberSearchQuery,
    onChange: function onChange(e) {
      return setMemberSearchQuery(e.target.value);
    },
    placeholder: "Search team members...",
    className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0] w-48 font-medium"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsInviteModalOpen(true);
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold"
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Invite Member")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
  }, membersList.filter(function (m) {
    if (!memberSearchQuery) return true;
    var q = memberSearchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  }).map(function (m) {
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between gap-4 hover:border-[#4F3FE0]/50 transition-all shadow-2xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start gap-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-12 h-12 rounded-full bg-gradient-to-tr from-[#4F3FE0] to-[#8B5CF6] text-white font-extrabold flex items-center justify-center text-sm shadow-sm flex-shrink-0"
    }, m.avatar), /*#__PURE__*/React.createElement("div", {
      className: "truncate flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-sm text-[#111827] truncate"
    }, m.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0]"
    }, m.role), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#8A90A2] truncate mt-0.5"
    }, m.email))), /*#__PURE__*/React.createElement("div", {
      className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-3 space-y-1.5 text-[11px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2] font-semibold"
    }, "Allocated Desk:"), /*#__PURE__*/React.createElement("span", {
      className: "font-black text-[#111827]"
    }, m.desk)), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2] font-semibold"
    }, "Monthly Usage:"), /*#__PURE__*/React.createElement("span", {
      className: "font-black text-[#4F3FE0]"
    }, m.hoursBooked, " hrs booked")), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2] font-semibold"
    }, "Access Level:"), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-emerald-600"
    }, m.access))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-xs pt-2 border-t border-[#ECEEF4]"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("Direct Slack invite sent to ".concat(m.name));
      },
      className: "text-[#4F3FE0] font-bold hover:underline"
    }, "Message →"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("Member permissions opened for ".concat(m.name));
      },
      className: "text-[#8A90A2] hover:text-[#111827] font-semibold"
    }, "Settings")));
  })), isInviteModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, "Invite Venture Team Member"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsInviteModalOpen(false);
    },
    className: "text-[#8A90A2] hover:text-[#111827] font-bold"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 text-xs font-bold text-[#374151]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newMemberData.name,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { name: e.target.value }));
    },
    placeholder: "e.g. Rohini Gupta",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Work Email Address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: newMemberData.email,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { email: e.target.value }));
    },
    placeholder: "rohini.g@xyztech.io",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Role / Title"), /*#__PURE__*/React.createElement("select", {
    value: newMemberData.role,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { role: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["Software Engineer", "AI/ML Specialist", "Product Designer", "Operations Manager", "Growth Lead"].map(function (r) {
    return /*#__PURE__*/React.createElement("option", {
      key: r,
      value: r
    }, r);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Workstation"), /*#__PURE__*/React.createElement("select", {
    value: newMemberData.desk,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { desk: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["Desk 4E (Floating)", "Desk 4F (Floating)", "Flexible Hot Desk", "Remote Keyholder"].map(function (d) {
    return /*#__PURE__*/React.createElement("option", {
      key: d,
      value: d
    }, d);
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsInviteModalOpen(false);
    },
    className: "px-4 py-2 border border-[#ECEEF4] rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (!newMemberData.name.trim() || !newMemberData.email.trim()) return showToast("Please provide name and email");
      var initials = newMemberData.name.split(" ").map(function (n) { return n[0]; }).join("").toUpperCase().slice(0, 2);
      var newM = {
        id: "m-".concat(Date.now()),
        name: newMemberData.name,
        email: newMemberData.email,
        role: newMemberData.role,
        avatar: initials || "TM",
        desk: newMemberData.desk,
        hoursBooked: 0,
        access: "Member Access"
      };
      setMembersList(function (prev) {
        return [newM].concat(prev);
      });
      setIsInviteModalOpen(false);
      setNewMemberData({ name: "", email: "", role: "AI Engineer", desk: "Desk 4E (Floating)" });
      showToast("Incubator invite sent to ".concat(newM.email));
    },
    className: "px-4 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-xs"
  }, "Send Team Invite"))))), activeNav === "Database Tables" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-xl bg-[#EEEBFF] flex items-center justify-center text-[#4F3FE0] flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "database",
    className: "w-6 h-6"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Database Tables & Collections"), /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
  }), "MongoDB Atlas Connected")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Live multi-tenant collections, index schemas, and records for NEXUS HUB Incubation OS"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 self-start md:self-auto"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return showToast("Database cache flushed. Fetched latest MongoDB Atlas records.");
    },
    className: "px-3.5 py-2 bg-[#F6F7FB] border border-[#ECEEF4] hover:bg-[#EEEBFF] hover:text-[#4F3FE0] text-[#374151] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "repeat",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Sync Data")), /*#__PURE__*/React.createElement("a", {
    href: "app.html",
    target: "_blank",
    rel: "noreferrer",
    className: "px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "Full Admin Shell"), /*#__PURE__*/React.createElement(Icon, {
    name: "externalLink",
    className: "w-3.5 h-3.5"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-semibold text-[#8A90A2]"
  }, "Active Cluster"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-extrabold text-[#111827] mt-0.5"
  }, "cluster0.nexus.net")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-semibold text-[#8A90A2]"
  }, "Collections"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-extrabold text-[#4F3FE0] mt-0.5"
  }, Object.keys(DB_COLLECTIONS).length, " Collections")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-semibold text-[#8A90A2]"
  }, "Selected Records"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-extrabold text-[#111827] mt-0.5"
  }, (DB_COLLECTIONS[dbCollection] || []).length, " Documents")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-semibold text-[#8A90A2]"
  }, "Database Latency"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-extrabold text-emerald-600 mt-0.5"
  }, "38ms Ping (Optimal)")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
  }, Object.keys(DB_COLLECTIONS).map(function (colName) {
    var isActive = dbCollection === colName;
    var count = DB_COLLECTIONS[colName].length;
    return /*#__PURE__*/React.createElement("button", {
      key: colName,
      onClick: function onClick() {
        setDbCollection(colName);
        setDbSearch("");
      },
      className: "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ".concat(isActive ? "bg-[#4F3FE0] text-white shadow-sm" : "bg-[#F6F7FB] text-[#374151] hover:bg-[#EEEBFF] hover:text-[#4F3FE0]")
    }, /*#__PURE__*/React.createElement("span", null, colName), /*#__PURE__*/React.createElement("span", {
      className: "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ".concat(isActive ? "bg-white/20 text-white" : "bg-white text-[#8A90A2] border border-[#ECEEF4]")
    }, count));
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative w-full sm:w-64 flex-shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    className: "w-4 h-4 text-[#8A90A2] absolute left-3 top-1/2 -translate-y-1/2"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: dbSearch,
    onChange: function onChange(e) {
      return setDbSearch(e.target.value);
    },
    placeholder: "Search ".concat(dbCollection, "..."),
    className: "w-full pl-9 pr-3 py-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left border-collapse text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#F8F9FD] border-b border-[#ECEEF4] text-[#8A90A2] font-bold uppercase tracking-wider text-[11px]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-3 px-4"
  }, "_id"), /*#__PURE__*/React.createElement("th", {
    className: "py-3 px-4"
  }, "Identifier / Title"), /*#__PURE__*/React.createElement("th", {
    className: "py-3 px-4"
  }, "Attributes"), /*#__PURE__*/React.createElement("th", {
    className: "py-3 px-4"
  }, "Status / State"), /*#__PURE__*/React.createElement("th", {
    className: "py-3 px-4 text-right"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-[#ECEEF4]"
  }, function () {
    var rawList = DB_COLLECTIONS[dbCollection] || [];
    var filtered = rawList.filter(function (item) {
      if (!dbSearch) return true;
      var query = dbSearch.toLowerCase();
      return Object.values(item).some(function (val) {
        return String(val).toLowerCase().includes(query);
      });
    });
    if (filtered.length === 0) {
      return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
        colSpan: 5,
        className: "py-8 text-center text-xs text-[#8A90A2]"
      }, "No records matched your search in collection ", /*#__PURE__*/React.createElement("strong", null, dbCollection)));
    }
    return filtered.map(function (row, idx) {
      var displayName = row.name || row.label || row.roomName || row.invoiceNumber || row.fullName || "Record #" + (idx + 1);
      var subInfo = row.founder || row.type || row.bookedBy || row.recipient || row.company || "";
      var status = row.status || "Active";
      var statusClasses = status === "Active" || status === "Available" || status === "Confirmed" || status === "Paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : status === "In Use" || status === "In Progress" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-indigo-50 text-[#4F3FE0] border border-indigo-200";
      return /*#__PURE__*/React.createElement("tr", {
        key: row._id || idx,
        className: "hover:bg-[#F9FAFC] transition-colors"
      }, /*#__PURE__*/React.createElement("td", {
        className: "py-3 px-4 font-mono text-[11px] text-[#4F3FE0] font-semibold whitespace-nowrap"
      }, row._id), /*#__PURE__*/React.createElement("td", {
        className: "py-3 px-4"
      }, /*#__PURE__*/React.createElement("div", {
        className: "font-bold text-[#111827]"
      }, displayName), subInfo && /*#__PURE__*/React.createElement("div", {
        className: "text-[11px] text-[#8A90A2] mt-0.5"
      }, subInfo)), /*#__PURE__*/React.createElement("td", {
        className: "py-3 px-4 text-[#374151]"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex flex-wrap gap-1.5 max-w-xs"
      }, row.capacity && /*#__PURE__*/React.createElement("span", {
        className: "bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium"
      }, "Cap: ", row.capacity), row.creditsRemaining !== undefined && /*#__PURE__*/React.createElement("span", {
        className: "bg-purple-50 text-[#4F3FE0] px-2 py-0.5 rounded text-[10px] font-bold"
      }, row.creditsRemaining, " cr"), row.creditsPerHour && /*#__PURE__*/React.createElement("span", {
        className: "bg-purple-50 text-[#4F3FE0] px-2 py-0.5 rounded text-[10px] font-bold"
      }, row.creditsPerHour, " cr/hr"), row.amount && /*#__PURE__*/React.createElement("span", {
        className: "bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold"
      }, row.amount), row.tier && /*#__PURE__*/React.createElement("span", {
        className: "bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium"
      }, row.tier), row.slot && /*#__PURE__*/React.createElement("span", {
        className: "bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-medium"
      }, row.slot))), /*#__PURE__*/React.createElement("td", {
        className: "py-3 px-4 whitespace-nowrap"
      }, /*#__PURE__*/React.createElement("span", {
        className: "px-2.5 py-1 rounded-full text-[11px] font-bold ".concat(statusClasses)
      }, status)), /*#__PURE__*/React.createElement("td", {
        className: "py-3 px-4 text-right whitespace-nowrap"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: function onClick() {
          return setSelectedDbDoc(row);
        },
        className: "px-3 py-1.5 bg-[#EEEBFF] hover:bg-[#4F3FE0] text-[#4F3FE0] hover:text-white rounded-lg font-bold text-[11px] transition-all"
      }, "Inspect JSON")));
    });
  }()))))), selectedDbDoc && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn",
    onClick: function onClick() {
      return setSelectedDbDoc(null);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#111827] text-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-700 p-6 space-y-4",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-gray-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "database",
    className: "w-5 h-5 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-extrabold text-sm text-white"
  }, "Document Inspector (", selectedDbDoc._id, ")")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setSelectedDbDoc(null);
    },
    className: "w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-xs font-bold"
  }, "\u2715")), /*#__PURE__*/React.createElement("pre", {
    className: "bg-[#0B0F19] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 border border-gray-800 leading-relaxed"
  }, JSON.stringify(selectedDbDoc, null, 2)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-gray-400"
  }, "Read-only sandbox replica"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      var _navigator$clipboard;
      (_navigator$clipboard = navigator.clipboard) === null || _navigator$clipboard === void 0 || _navigator$clipboard.writeText(JSON.stringify(selectedDbDoc, null, 2));
      showToast("Copied JSON payload to clipboard!");
    },
    className: "px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-all"
  }, "Copy JSON"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setSelectedDbDoc(null);
    },
    className: "px-4 py-1.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white text-xs font-bold rounded-lg transition-all"
  }, "Close"))))), activeNav === "Settings" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Preferences & Integrations"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Calendar synchronization, notifications and security")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-4 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-sm text-[#111827]"
  }, "Google Calendar Sync"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#8A90A2]"
  }, "Automatically push confirmed room reservations to your company GSuite")), /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full text-xs"
  }, "Connected")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-4 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-sm text-[#111827]"
  }, "WhatsApp Booking Alerts"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#8A90A2]"
  }, "Receive 15-minute room start reminders and access passcodes")), /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full text-xs"
  }, "Active (+91 9880012345)")), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-sm text-[#111827]"
  }, "Full Operating System Command Center"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-[#8A90A2]"
  }, "Access complete multi-tenant database tables, invoicing & admin controls")), /*#__PURE__*/React.createElement("a", {
    href: "app.html",
    className: "bg-[#111827] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "Launch Terminal"), /*#__PURE__*/React.createElement(Icon, {
    name: "externalLink",
    className: "w-3.5 h-3.5"
  }))))))), bookingModalRoom && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-[#ECEEF4] max-h-[92vh] overflow-y-auto relative animate-scaleUp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-4 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: bookingModalRoom.image || "assets/rooms/mr-01-main.jpg",
    alt: bookingModalRoom.name,
    className: "w-12 h-12 rounded-xl object-cover border border-[#ECEEF4] shadow-xs flex-shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, bookingModalRoom.name), /*#__PURE__*/React.createElement("span", {
    className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4F3FE0] text-white uppercase tracking-wider"
  }, bookingModalRoom.type)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Instant confirmation \u2022 Deducts 1 hour credit"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      setBookingModalRoom(null);
      setBookingSuccessData(null);
    },
    className: "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors",
    title: "Close"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  }))), bookingSuccessData ? /*#__PURE__*/React.createElement("div", {
    className: "py-6 text-center space-y-4 animate-scaleUp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto text-2xl font-bold shadow-sm"
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200"
  }, "Reservation Confirmed"), /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-black text-[#111827] mt-2"
  }, bookingSuccessData.title), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2]"
  }, "Booking Reference: ", /*#__PURE__*/React.createElement("strong", {
    className: "font-mono text-[#111827]"
  }, "#", bookingSuccessData.resId))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2]"
  }, "Facility:"), /*#__PURE__*/React.createElement("strong", {
    className: "text-[#111827]"
  }, bookingSuccessData.room)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2]"
  }, "Date & Time:"), /*#__PURE__*/React.createElement("strong", {
    className: "text-[#111827]"
  }, bookingSuccessData.date, " \u2022 ", bookingSuccessData.time)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2]"
  }, "Duration & Attendees:"), /*#__PURE__*/React.createElement("strong", {
    className: "text-[#111827]"
  }, bookingSuccessData.duration, " \u2022 ", bookingSuccessData.attendees, " people")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2]"
  }, "Credit Deducted:"), /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-600 font-bold"
  }, "-", bookingSuccessData.credits, " cr (Covered by Incubation Plan)"))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-left max-w-md mx-auto space-y-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("strong", {
    className: "text-xs font-black text-[#111827]"
  }, "Sync with Your Calendar")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-[#64748B] leading-relaxed"
  }, "Export this reservation directly to Google Calendar or download an .ICS invite for Outlook / Apple Calendar."), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 pt-1"
  }, /*#__PURE__*/React.createElement("a", {
    href: getGCalUrl(bookingSuccessData),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "flex-1 bg-white hover:bg-blue-50 text-[#2B71FF] border border-blue-300 font-bold py-2 px-3 rounded-xl text-xs text-center shadow-xs flex items-center justify-center gap-1.5 transition-all"
  }, /*#__PURE__*/React.createElement("span", null, "Google Calendar (1-Click)"), /*#__PURE__*/React.createElement(Icon, {
    name: "externalLink",
    className: "w-3.5 h-3.5"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return downloadIcsFile(bookingSuccessData);
    },
    className: "bg-white hover:bg-gray-50 text-[#374151] border border-gray-300 font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition-all",
    title: "Download iCal (.ics) file"
  }, "\uD83D\uDCE5 .ICS"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-3 pt-3"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      setBookingModalRoom(null);
      setBookingSuccessData(null);
      navigateTo("My Bookings");
    },
    className: "px-5 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm"
  }, "View in My Bookings \u2192"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      setBookingModalRoom(null);
      setBookingSuccessData(null);
    },
    className: "px-5 py-2.5 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
  }, "Done"))) : /*#__PURE__*/React.createElement("form", {
    onSubmit: handleConfirmBookingModal,
    className: "mt-4 space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-[#374151] mb-1"
  }, "Meeting Title ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: bookingTitle,
    onChange: function onChange(e) {
      return setBookingTitle(e.target.value);
    },
    placeholder: "e.g. Q4 Executive Pitch Session",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1.5"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs font-bold text-[#374151] flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "Reservation Date")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleSetToday,
    className: "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ".concat(bookingDate === getTodayDateIso() ? "bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-xs" : "bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-white hover:border-[#4F3FE0]/40")
  }, "\u26A1 Today"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleSetNextDay,
    className: "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ".concat(bookingDate === getTomorrowDateIso() ? "bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-xs" : "bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-white hover:border-[#4F3FE0]/40")
  }, "\u26A1 Next Day"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-4 h-4 text-[#8A90A2]"
  }), /*#__PURE__*/React.createElement("input", {
    type: "date",
    min: "2026-10-31",
    value: bookingDate,
    onChange: function onChange(e) {
      return setBookingDate(e.target.value);
    },
    className: "bg-transparent text-xs font-bold text-[#111827] outline-none cursor-pointer flex-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-[#8A90A2] font-medium"
  }, bookingDate === getTodayDateIso() ? "(Today)" : bookingDate === getTomorrowDateIso() ? "(Tomorrow)" : ""))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-[#374151] mb-1 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "Start Time (12-Hour AM/PM)")), /*#__PURE__*/React.createElement("select", {
    value: bookingStartTime,
    onChange: function onChange(e) {
      return setBookingStartTime(e.target.value);
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
  }, TIME_SLOTS_12H.map(function (slot) {
    var slotInfo = getSlotState(slot, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
    return /*#__PURE__*/React.createElement("option", {
      key: slot,
      value: slot,
      disabled: slotInfo.disabled && slotInfo.status !== 'selected'
    }, slot, " ", slotInfo.status === 'past' ? '(Past)' : slotInfo.status === 'booked' ? '(Booked)' : slotInfo.status === 'unavailable' ? '(Overlap)' : '(Available)');
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-[#374151] mb-1 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "Duration & End Time")), /*#__PURE__*/React.createElement("select", {
    value: bookingDuration,
    onChange: function onChange(e) {
      return setBookingDuration(parseFloat(e.target.value));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
  }, [0.5, 1.0, 1.5, 2.0, 3.0, 4.0].map(function (dur) {
    var sMin = timeStrToMinutes(bookingStartTime);
    var eMin = sMin + Math.round(dur * 60);
    var endStr = minutesToTimeStr(eMin);
    return /*#__PURE__*/React.createElement("option", {
      key: dur,
      value: dur
    }, dur === 0.5 ? "30 mins" : "".concat(dur, " hrs"), " (Ends at ", endStr, ")");
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs font-black uppercase tracking-wider text-[#111827]"
  }, "Time Slot Bar & Live Availability"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-[#8A90A2]"
  }, isLoadingAvailability ? "Updating live availability..." : "Click any green slot to select your start time")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-[10.5px] font-semibold text-[#64748B] flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-emerald-500"
  }), " Available"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#4F3FE0]"
  }), " Selected"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-gray-400"
  }), " Booked"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-gray-300"
  }), " Past"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 border border-[#ECEEF4] rounded-2xl bg-[#FAFAFC]"
  }, TIME_SLOTS_12H.map(function (slot) {
    var slotState = getSlotState(slot, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
    if (slotState.status === "past") {
      return /*#__PURE__*/React.createElement("div", {
        key: slot,
        className: "p-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 text-center cursor-not-allowed select-none opacity-50",
        title: "This time slot has already passed for today"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[11.5px] font-bold line-through"
      }, slot), /*#__PURE__*/React.createElement("div", {
        className: "text-[9.5px] text-gray-500 font-semibold mt-0.5"
      }, "\u23F3 Past"));
    }
    if (slotState.status === "booked") {
      return /*#__PURE__*/React.createElement("div", {
        key: slot,
        className: "p-2 rounded-xl border border-gray-200 bg-gray-100/90 text-gray-400 text-center cursor-not-allowed select-none opacity-60",
        title: "Slot already reserved by another founder"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[11.5px] font-bold line-through"
      }, slot), /*#__PURE__*/React.createElement("div", {
        className: "text-[9.5px] text-gray-500 font-semibold mt-0.5"
      }, "\uD83D\uDD12 Booked"));
    }
    if (slotState.status === "unavailable") {
      return /*#__PURE__*/React.createElement("div", {
        key: slot,
        className: "p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-700 text-center cursor-not-allowed select-none",
        title: "Overlap conflict: Duration would overlap a reserved slot"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[11.5px] font-bold"
      }, slot), /*#__PURE__*/React.createElement("div", {
        className: "text-[9.5px] font-semibold text-amber-600 mt-0.5"
      }, "Overlap"));
    }
    if (slotState.status === "selected") {
      return /*#__PURE__*/React.createElement("button", {
        key: slot,
        type: "button",
        onClick: function onClick() {
          return setBookingStartTime(slot);
        },
        className: "p-2 rounded-xl border border-[#4F3FE0] bg-[#4F3FE0] text-white text-center shadow-sm ring-2 ring-[#4F3FE0]/25 transition-all"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[11.5px] font-bold"
      }, slot), /*#__PURE__*/React.createElement("div", {
        className: "text-[9.5px] font-bold text-purple-100 mt-0.5"
      }, "\u2605 Selected"));
    }
    return /*#__PURE__*/React.createElement("button", {
      key: slot,
      type: "button",
      onClick: function onClick() {
        return setBookingStartTime(slot);
      },
      className: "p-2 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-400 text-emerald-950 text-center transition-all hover:shadow-xs active:scale-95"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11.5px] font-bold"
    }, slot), /*#__PURE__*/React.createElement("div", {
      className: "text-[9.5px] font-bold text-emerald-600 mt-0.5"
    }, "\u2713 Available"));
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs font-bold text-[#374151] flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    className: "w-3.5 h-3.5 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "Attendees Count")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-[#8A90A2]"
  }, "Room Max: ", bookingModalRoom.capacity, " seats")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setBookingAttendees(function (prev) {
        return Math.max(1, prev - 1);
      });
    },
    className: "w-9 h-9 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:bg-white text-lg font-bold flex items-center justify-center text-[#111827]"
  }, "-"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl py-2 text-center text-xs font-black text-[#111827]"
  }, bookingAttendees, " attendees"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setBookingAttendees(function (prev) {
        return Math.min(bookingModalRoom.capacity, prev + 1);
      });
    },
    className: "w-9 h-9 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:bg-white text-lg font-bold flex items-center justify-center text-[#111827]"
  }, "+"))), function () {
    var hourlyRate = parseInt((bookingModalRoom.rate || "").replace(/[^0-9]/g, ""), 10) || 2000;
    var sMin = timeStrToMinutes(bookingStartTime);
    var eMin = sMin + Math.round(bookingDuration * 60);
    var endStr = minutesToTimeStr(eMin);
    var currentSelectedState = getSlotState(bookingStartTime, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
    return /*#__PURE__*/React.createElement("div", {
      className: "bg-[#F8F9FD] border border-[#E3DEFF] rounded-2xl p-4 space-y-2 text-xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2]"
    }, "Room Rate:"), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#111827]"
    }, bookingModalRoom.rate, " (Covered by Credits)")), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2]"
    }, "Date & Time:"), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#4F3FE0]"
    }, bookingDate, " \u2022 ", bookingStartTime, " \u2013 ", endStr, " (", bookingDuration, " hrs)")), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2]"
    }, "Attendees:"), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#111827]"
    }, bookingAttendees, " people (Capacity: ", bookingModalRoom.capacity, ")")), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2]"
    }, "Credits Used:"), /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-600 font-bold"
    }, "-", bookingDuration, " cr (", startupCreditsRemaining - bookingDuration, " cr remaining in quota)")), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between pt-1 border-t border-[#E3DEFF]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#111827]"
    }, "Final Charge:"), /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-600 font-black text-sm"
    }, "\u20B90.00 (100% Covered)")), currentSelectedState.disabled && !currentSelectedState.isSelected && /*#__PURE__*/React.createElement("div", {
      className: "p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-1.5 mt-2"
    }, /*#__PURE__*/React.createElement("span", null, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("span", null, "Selected time slot is ", currentSelectedState.label, ". Please pick an available green slot.")));
  }(), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-blue-900 font-semibold"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("span", null, "Auto-generate Google Calendar invite")), /*#__PURE__*/React.createElement("label", {
    className: "relative inline-flex items-center cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: bookingSyncGCal,
    onChange: function onChange(e) {
      return setBookingSyncGCal(e.target.checked);
    },
    className: "sr-only peer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F3FE0]"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setBookingModalRoom(null);
    },
    className: "px-4 py-2.5 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "px-6 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "\u26A1 Confirm Reservation")))))), cancelModalBooking && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center font-bold"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alertCircle",
    className: "w-5 h-5 text-[#EF4444]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-black text-[#111827]"
  }, "Cancel Reservation"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-[#8A90A2]"
  }, "Review refund policy before confirming"))), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setCancelModalBooking(null);
    },
    className: "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "py-4 space-y-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl text-xs space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827] text-sm"
  }, cancelModalBooking.title), /*#__PURE__*/React.createElement("div", {
    className: "text-[#64748B] flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD ", cancelModalBooking.room), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD52 ", cancelModalBooking.time)), /*#__PURE__*/React.createElement("div", {
    className: "text-emerald-600 font-bold flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDE99 Refund Quote:"), /*#__PURE__*/React.createElement("span", null, "+", cancelModalBooking.credits || 18, " credits returned to balance"))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed"
  }, /*#__PURE__*/React.createElement("strong", null, "NEXUS Cancellation Policy:"), " Meeting room cancellations confirmed >2 hours in advance receive a ", /*#__PURE__*/React.createElement("strong", null, "100% full credit refund"), ". The reserved slot will be released immediately to fellow founders.")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setCancelModalBooking(null);
    },
    className: "px-4 py-2 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
  }, "Keep Booking"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      setUpcomingBookings(function (prev) {
        return prev.map(function (b) {
          if (b.id === cancelModalBooking.id) {
            return _objectSpread(_objectSpread({}, b), {}, {
              status: "Cancelled",
              statusColor: "bg-rose-50 text-rose-600 border border-rose-200",
              barColor: "bg-rose-500"
            });
          }
          return b;
        });
      });
      showToast("Reservation #".concat(cancelModalBooking.resId, " cancelled. ").concat(cancelModalBooking.credits || 18, " credits refunded."));
      setCancelModalBooking(null);
    },
    className: "px-5 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-bold shadow-sm"
  }, "Confirm Cancellation")))), detailsModalBooking && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp max-h-[90vh] overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-mono font-bold bg-gray-100 text-[#374151] px-2 py-0.5 rounded border border-[#ECEEF4]"
  }, "#", detailsModalBooking.resId), /*#__PURE__*/React.createElement("span", {
    className: "px-2.5 py-0.5 rounded-full text-xs font-bold ".concat(detailsModalBooking.statusColor)
  }, detailsModalBooking.status)), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setDetailsModalBooking(null);
    },
    className: "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "py-4 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative h-32 rounded-xl overflow-hidden border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("img", {
    src: detailsModalBooking.roomImage || "assets/rooms/mr-01-main.jpg",
    alt: detailsModalBooking.room,
    className: "w-full h-full object-cover object-center"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-2.5 left-3 text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black"
  }, detailsModalBooking.room), /*#__PURE__*/React.createElement("div", {
    className: "text-[10.5px] text-gray-200"
  }, "Level 2 \u2022 Collaboration Suite \u2022 Ground Floor East Wing"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, detailsModalBooking.title), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#64748B] mt-1 leading-relaxed"
  }, detailsModalBooking.purpose || "Meeting session scheduled for venture development and collaboration.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase"
  }, "Scheduled Time"), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827] mt-1"
  }, detailsModalBooking.fullDate || detailsModalBooking.date), /*#__PURE__*/React.createElement("div", {
    className: "text-[#64748B] text-[11px] mt-0.5"
  }, detailsModalBooking.time)), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase"
  }, "Party Size"), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827] mt-1"
  }, detailsModalBooking.attendees, " Attendees"), /*#__PURE__*/React.createElement("div", {
    className: "text-[#64748B] text-[11px] mt-0.5"
  }, "Alex Morgan (Host)")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase"
  }, "Quota Consumed"), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#4F3FE0] mt-1"
  }, "\uD83E\uDE99 ", detailsModalBooking.credits || 18, " credits"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-emerald-600 font-semibold mt-0.5"
  }, "\u25CF Deducted from quota")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] font-bold text-[#8A90A2] uppercase"
  }, "Calendar Sync"), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-emerald-600 mt-1 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "Synced"), /*#__PURE__*/React.createElement("span", null, "\u2705")), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-[#8A90A2] mt-0.5"
  }, "Google / Outlook active"))), detailsModalBooking.isRecurring && /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F4F2FF] border border-[#E3DEFF] rounded-xl text-xs flex items-center gap-2 text-[#4F3FE0]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDD04"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Recurring Series:"), " ", detailsModalBooking.recurringPattern || "Weekly schedule active"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-3 border-t border-[#ECEEF4]"
  }, detailsModalBooking.status !== "Cancelled" && detailsModalBooking.status !== "Completed" ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      var target = detailsModalBooking;
      setDetailsModalBooking(null);
      setRescheduleBooking(target);
      setRescheduleNewRoom(target.room);
      setRescheduleNewTime(target.time);
    },
    className: "px-3.5 py-1.5 border border-[#ECEEF4] text-[#374151] hover:text-[#4F3FE0] rounded-xl text-xs font-bold hover:bg-gray-50"
  }, "Reschedule"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      var target = detailsModalBooking;
      setDetailsModalBooking(null);
      setCancelModalBooking(target);
    },
    className: "px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold"
  }, "Cancel Booking")) : /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setDetailsModalBooking(null);
    },
    className: "px-5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm"
  }, "Close")))), showPurchaseCreditsModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, "Purchase Extra Credits"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2]"
  }, "Instant credit top-up \u2022 No expiration")), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowPurchaseCreditsModal(false);
    },
    className: "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "py-4 space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-[#111827]"
  }, "Select Credit Package:"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2.5"
  }, [{
    credits: 10,
    price: "₹500",
    tag: "Basic"
  }, {
    credits: 25,
    price: "₹1,200",
    tag: "Popular",
    best: true
  }, {
    credits: 50,
    price: "₹2,200",
    tag: "Best Value"
  }].map(function (pkg) {
    return /*#__PURE__*/React.createElement("button", {
      key: pkg.credits,
      type: "button",
      onClick: function onClick() {
        return setSelectedCreditTier(pkg.credits);
      },
      className: "p-3 rounded-xl border text-center transition-all ".concat(selectedCreditTier === pkg.credits ? "border-[#4F3FE0] bg-[#EEEBFF] text-[#4F3FE0] shadow-xs" : "border-[#ECEEF4] bg-[#F8FAFC] text-[#374151] hover:bg-white")
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold uppercase tracking-wider text-[#8A90A2]"
    }, pkg.tag), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-black text-[#111827] mt-0.5"
    }, pkg.credits, " cr"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0] mt-0.5"
    }, pkg.price));
  })), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl text-xs space-y-1.5 mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[#64748B]"
  }, /*#__PURE__*/React.createElement("span", null, "Startup Account:"), /*#__PURE__*/React.createElement("strong", {
    className: "text-[#111827]"
  }, "XYZ Technologies")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[#64748B]"
  }, /*#__PURE__*/React.createElement("span", null, "Payment Gateway:"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#4F3FE0] font-bold"
  }, "Razorpay Express (UPI / Cards)")))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setShowPurchaseCreditsModal(false);
    },
    className: "px-4 py-2 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: function onClick() {
      setShowPurchaseCreditsModal(false);
      showToast("\uD83C\uDF89 Top-up successful! +".concat(selectedCreditTier, " extra credits credited."));
    },
    className: "px-5 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm"
  }, "Confirm & Top-up")))), toastMessage && /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-6 right-6 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-gray-700 z-50 flex items-center gap-2 animate-bounce"
  }, /*#__PURE__*/React.createElement("span", null, "\u26A1"), /*#__PURE__*/React.createElement("span", null, toastMessage)));
}
if (typeof ReactDOM !== 'undefined') {
  var rootEl = document.getElementById('root');
  if (rootEl) {
    if (ReactDOM.createRoot) {
      if (!window._nexusRoot) window._nexusRoot = ReactDOM.createRoot(rootEl);
      window._nexusRoot.render(React.createElement(MeetingRoomsApp, null));
    } else if (ReactDOM.render) {
      ReactDOM.render(React.createElement(MeetingRoomsApp, null), rootEl);
    }
  }
}
window._nexusHubMounted = true;
