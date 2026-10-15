const ICONS = {
  add: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="m5 12 14-7-4 14-3-5-7-2Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dots: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  message: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48A8.55 8.55 0 0 1 8.5 18L4 20l1.4-4.2A7.5 7.5 0 1 1 20 11.5Z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.13 2.13-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V20.3H11.3v-.08A1.7 1.7 0 0 0 10.27 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.13-2.13.06-.06A1.7 1.7 0 0 0 6.6 15a1.7 1.7 0 0 0-1.55-1.03H5v-3h.05A1.7 1.7 0 0 0 6.6 9.94a1.7 1.7 0 0 0-.34-1.88L6.2 8 8.33 5.87l.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.3 4.72V4.6h3.4v.12a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03H21v3h-.05A1.7 1.7 0 0 0 19.4 15Z" /></>,
  smile: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.2s1.1 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>,
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}
