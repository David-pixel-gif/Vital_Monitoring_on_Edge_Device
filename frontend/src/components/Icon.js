export default function Icon({ name, size = 18, className = "" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  switch (name) {
    case "dashboard":
      return <svg {...common}><path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 10h8V3h-8zM3 21h8v-4H3z" /></svg>;
    case "monitor":
      return <svg {...common}><path d="M3 5h18v12H3z" /><path d="m7 19 5-5 3 3 2-2" /></svg>;
    case "patients":
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 8v6M17 11h6" /></svg>;
    case "history":
      return <svg {...common}><path d="M12 8v4l3 3" /><path d="M3.05 11A9 9 0 1 1 6 17.3" /><path d="M3 4v7h7" /></svg>;
    case "alerts":
      return <svg {...common}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
    case "devices":
      return <svg {...common}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10 6h4M10 18h4" /></svg>;
    case "reports":
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .9 1.6-1.8 3.1-1.8-.4a7.8 7.8 0 0 1-1.4.8L15 22h-6l-.3-1.9a7.8 7.8 0 0 1-1.4-.8l-1.8.4-1.8-3.1.9-1.6a7.4 7.4 0 0 1 0-1.8l-.9-1.6 1.8-3.1 1.8.4c.4-.3.9-.6 1.4-.8L9 2h6l.3 1.9c.5.2 1 .5 1.4.8l1.8-.4 1.8 3.1-.9 1.6c.1.6.1 1.2 0 1.8Z" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "notification":
      return <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
    case "spark":
      return <svg {...common}><path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7Z" /></svg>;
    case "heart":
      return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>;
    case "temp":
      return <svg {...common}><path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" /></svg>;
    case "spo2":
      return <svg {...common}><path d="M12 21s-6-4.4-6-10a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.6-6 10-6 10h-4Z" /></svg>;
    case "risk":
      return <svg {...common}><path d="m12 3 8 4.5v5c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9v-5Z" /><path d="M12 8v4M12 16h.01" /></svg>;
    case "device":
      return <svg {...common}><path d="M4 8h16M8 4v4M16 4v4M8 16v4M16 16v4" /><rect x="6" y="8" width="12" height="8" rx="2" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "export":
      return <svg {...common}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
    case "empty":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9 10h.01M15 10h.01M8.5 15c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "logout":
      return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>;
    case "menu":
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close":
      return <svg {...common}><path d="M6 6 18 18M18 6 6 18" /></svg>;
    case "chevronDown":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case "chevronUp":
      return <svg {...common}><path d="m6 15 6-6 6 6" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
