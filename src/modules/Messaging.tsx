import { useState, useRef, useEffect } from "react";
import { CONVERSATIONS, EMPLOYEES } from "../data/dummy";
import { logActivity } from "../data/activityLog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  from: string;
  text: string;
  time: string;
  read: boolean;
  images?: string[];
};

type Conversation = {
  id: string;
  participants: string[];
  subject: string;
  messages: Message[];
  lastActivity: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ["#25205B", "#6B9FE5", "#D4A843", "#a78bfa", "#f59e0b", "#34D1BF", "#9DA8C0", "#C084FC"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFFFF;
  return colors[Math.abs(h) % colors.length];
}

function hasUnread(conv: Conversation, me: string) {
  return conv.messages.some((m) => !m.read && m.from !== me);
}

function getOtherParticipants(conv: Conversation, me: string) {
  const others = conv.participants.filter((p) => p !== me);
  return others.length > 0 ? others : [conv.participants[0]];
}

function formatTime(t: string): string {
  const [date, time] = t.split(" ");
  const today = new Date().toISOString().slice(0, 10);
  return date === today ? (time ?? t) : (date ?? t);
}

function formatFullTime(t: string): string {
  const [date, time] = t.split(" ");
  return `${date ?? ""} ${time ?? ""}`.trim();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: getAvatarColor(name), fontSize: size * 0.34 }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Image Attachment Helper ──────────────────────────────────────────────────

function readImageFiles(files: FileList): Promise<string[]> {
  const promises = Array.from(files).map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith("image/")) return reject("Not an image");
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
  );
  return Promise.all(promises);
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar name={msg.from} size={30} />
      <div className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
        <span className="text-[11px] font-medium px-1" style={{ color: "#69707D" }}>{msg.from}</span>

        {/* Text bubble */}
        {msg.text && (
          <div
            className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
            style={isMe ? { background: "#25205B", color: "white" } : { background: "#F3F4F8", color: "#252731" }}
          >
            {msg.text}
          </div>
        )}

        {/* Image attachments */}
        {msg.images && msg.images.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
            {msg.images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="block">
                <img
                  src={src}
                  alt={`attachment-${i + 1}`}
                  className="rounded-xl object-cover border border-[#E8EAF0] cursor-zoom-in"
                  style={{ maxWidth: 180, maxHeight: 180, width: "auto", height: "auto" }}
                />
              </a>
            ))}
          </div>
        )}

        <span className="text-[10px] px-1" style={{ color: "#B8C4D4" }}>{formatFullTime(msg.time)}</span>
      </div>
    </div>
  );
}

// ─── Recipient Picker ─────────────────────────────────────────────────────────

function RecipientPicker({
  value, onChange, currentUser,
}: {
  value: string; onChange: (name: string) => void; currentUser: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = EMPLOYEES.filter(
    (e) => e.name !== currentUser && (
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full border rounded-xl px-3.5 py-2.5 cursor-pointer flex items-center gap-2.5 transition-colors min-h-[42px]"
        style={{ borderColor: open ? "#6B9FE5" : "#E8EAF0" }}
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <>
            <Avatar name={value} size={24} />
            <span className="text-[13px] font-semibold" style={{ color: "#1e1b4b" }}>{value}</span>
            <button
              className="ml-auto text-[#9CA3AF] hover:text-[#69707D]"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            >×</button>
          </>
        ) : (
          <span className="text-[13px]" style={{ color: "#9CA3AF" }}>Select a staff member…</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0" style={{ color: "#9CA3AF", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border z-50 overflow-hidden" style={{ borderColor: "#E8EAF0" }}>
          <div className="p-2.5 border-b border-[#F0F2F5]">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search by name, role, department…"
              className="w-full px-3 py-2 text-[12px] rounded-lg border focus:outline-none"
              style={{ borderColor: "#E8EAF0", color: "#252731" }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {options.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-center" style={{ color: "#9CA3AF" }}>No staff found</p>
            ) : options.map((emp) => (
              <button
                key={emp.id}
                type="button"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#F7F8FA] transition-colors text-left"
                onClick={() => { onChange(emp.name); setOpen(false); setSearch(""); }}
              >
                <Avatar name={emp.name} size={30} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold truncate" style={{ color: "#1e1b4b" }}>{emp.name}</div>
                  <div className="text-[10.5px] truncate" style={{ color: "#6B9FE5" }}>{emp.role} · {emp.department}</div>
                </div>
                {value === emp.name && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#6B9FE5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Conversation Modal ───────────────────────────────────────────────────

function NewConversationModal({
  currentUser,
  onClose,
  onSend,
}: {
  currentUser: string;
  onClose: () => void;
  onSend: (conv: Conversation) => void;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImages = async (files: FileList | null) => {
    if (!files) return;
    const imgs = await readImageFiles(files);
    setImages((prev) => [...prev, ...imgs]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject.trim() || (!message.trim() && images.length === 0)) return;
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const newConv: Conversation = {
      id: "CV-" + String(Date.now()).slice(-5),
      participants: [currentUser, to],
      subject: subject.trim(),
      messages: [{
        id: "m-" + Date.now(),
        from: currentUser,
        text: message.trim(),
        time: now,
        read: true,
        ...(images.length > 0 ? { images } : {}),
      }],
      lastActivity: now,
    };
    onSend(newConv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E8EAF0]">
        <div className="px-6 pt-6 pb-4 border-b border-[#E8EAF0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold" style={{ color: "#25205B" }}>New Message</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Send a direct message to any staff member</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#69707D]">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>To *</label>
            <RecipientPicker value={to} onChange={setTo} currentUser={currentUser} />
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Subject *</label>
            <input
              required
              className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#6B9FE5] transition-colors"
              style={{ borderColor: "#E8EAF0", color: "#25205B" }}
              placeholder="What is this about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#69707D" }}>Message</label>
            <textarea
              rows={4}
              className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#6B9FE5] transition-colors"
              style={{ borderColor: "#E8EAF0", color: "#25205B" }}
              placeholder="Write your message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#E8EAF0]" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center leading-none"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-[#F0F2F5]">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border border-[#E8EAF0] text-[#69707D] hover:bg-[#F7F8FA] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="4.5" cy="4.5" r="1" fill="currentColor" />
                <path d="M1 9l3-3 2.5 2.5L9 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImages(e.target.files)}
            />
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] rounded-xl border border-[#E8EAF0] font-semibold" style={{ color: "#69707D" }}>Cancel</button>
              <button
                type="submit"
                disabled={!to || !subject.trim() || (!message.trim() && images.length === 0)}
                className="px-5 py-2 text-[13px] rounded-xl font-semibold text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#25205B" }}
              >
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Messaging() {
  const session = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const currentUser: string = session.name ?? "Emeka Okonkwo";
  const currentRole: string = (session.role ?? "staff").toUpperCase();

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const seeded = CONVERSATIONS as Conversation[];
    // ensure current user appears in at least their relevant conversations
    return seeded.filter((c) => c.participants.includes(currentUser) || c.participants.includes("Emeka Okonkwo"))
      .map((c) => ({
        ...c,
        participants: c.participants.includes(currentUser)
          ? c.participants
          : [currentUser, ...c.participants.filter((p) => p !== "Emeka Okonkwo")],
      }));
  });

  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    const others = getOtherParticipants(c, currentUser);
    return others.some((p) => p.toLowerCase().includes(q)) || c.subject.toLowerCase().includes(q);
  });

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + (hasUnread(c, currentUser) ? 1 : 0), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, activeConv?.messages.length]);

  function handleSelectConv(id: string) {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: c.messages.map((m) => m.from !== currentUser ? { ...m, read: true } : m) }
          : c
      )
    );
  }

  function handleSend() {
    if ((!replyText.trim() && replyImages.length === 0) || !activeId) return;
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const newMsg: Message = {
      id: "m-" + Date.now(),
      from: currentUser,
      text: replyText.trim(),
      time: now,
      read: true,
      ...(replyImages.length > 0 ? { images: replyImages } : {}),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastActivity: now } : c
      )
    );
    setReplyText("");
    setReplyImages([]);
    const conv = conversations.find((c) => c.id === activeId);
    logActivity({
      timestamp: now, actor: currentUser, role: currentRole,
      action: "Message Sent", module: "Messaging",
      detail: `Reply sent in "${conv?.subject ?? activeId}"${replyImages.length > 0 ? ` with ${replyImages.length} image(s)` : ""}`,
      ref: activeId, severity: "info",
    });
  }

  function handleNewConv(conv: Conversation) {
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: currentUser, role: currentRole,
      action: "New Conversation Started", module: "Messaging",
      detail: `Started conversation with ${getOtherParticipants(conv, currentUser).join(", ")}`,
      ref: conv.id, severity: "info",
    });
  }

  async function handleImageAttach(files: FileList | null) {
    if (!files) return;
    const imgs = await readImageFiles(files);
    setReplyImages((prev) => [...prev, ...imgs]);
  }

  return (
    <div className="flex flex-col" style={{ height: "100%", background: "#F7F8FA" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EAF2FC" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1.5 1.5h13v10H8.5L5 13.5V11.5H1.5V1.5z" stroke="#25205B" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M4.5 5.5h7M4.5 8h4.5" stroke="#25205B" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-bold leading-none" style={{ color: "#25205B" }}>Messages</h1>
            {totalUnread > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: "#6B9FE5" }}>{totalUnread} unread</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#25205B" }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.7" strokeLinecap="round" /></svg>
          New
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Conversation list ── */}
        <div
          className={`flex-col bg-white border-r border-[#E5E7EB] overflow-y-auto ${activeId ? "hidden md:flex" : "flex"} md:flex w-full md:w-72 md:min-w-[272px] md:max-w-[272px] shrink-0`}
        >
          {/* Search */}
          <div className="p-3 border-b border-[#F0F2F5] shrink-0">
            <div className="relative">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }}>
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] focus:outline-none"
                style={{ border: "1px solid #E8EAF0", color: "#25205B", background: "#F7F8FA" }}
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations */}
          {filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[12px] text-center px-6" style={{ color: "#B8C4D4" }}>No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F6F7F9]">
              {filtered.map((conv) => {
                const others = getOtherParticipants(conv, currentUser);
                const displayName = others.join(", ");
                const unread = hasUnread(conv, currentUser);
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isActive = conv.id === activeId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#F7F8FA]"
                    style={{ background: isActive ? "#EAF2FC" : "transparent" }}
                  >
                    {/* Multi-participant: show stacked avatars or single */}
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar name={others[0]} size={38} />
                      {others.length > 1 && (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold"
                          style={{ background: getAvatarColor(others[1]) }}
                        >
                          +{others.length - 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[12.5px] font-semibold truncate" style={{ color: unread ? "#25205B" : "#374151" }}>
                          {displayName}
                        </span>
                        <span className="text-[10px] shrink-0" style={{ color: "#9CA3AF" }}>{formatTime(conv.lastActivity)}</span>
                      </div>
                      <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: "#6B9FE5" }}>{conv.subject}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {unread && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#6B9FE5" }} />}
                        <p className="text-[11px] truncate" style={{ color: unread ? "#374151" : "#9CA3AF", fontWeight: unread ? 500 : 400 }}>
                          {lastMsg?.images && lastMsg.images.length > 0 && !lastMsg.text ? "📷 Photo" : lastMsg?.text ?? ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Message thread ── */}
        <div className={`flex-col flex-1 min-w-0 overflow-hidden ${activeId ? "flex" : "hidden md:flex"}`}>
          {activeConv ? (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA] shrink-0"
                  style={{ color: "#25205B" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>

                {/* Avatars */}
                <div className="flex items-center -space-x-2 shrink-0">
                  {getOtherParticipants(activeConv, currentUser).slice(0, 3).map((p, i) => (
                    <div key={p} className="rounded-full border-2 border-white" style={{ zIndex: 10 - i }}>
                      <Avatar name={p} size={32} />
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: "#25205B" }}>{activeConv.subject}</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: "#69707D" }}>
                    {getOtherParticipants(activeConv, currentUser).join(" · ")}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                {activeConv.messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} isMe={msg.from === currentUser} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="px-4 py-3 bg-white border-t border-[#E5E7EB] shrink-0">
                {/* Image previews */}
                {replyImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {replyImages.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="w-14 h-14 object-cover rounded-lg border border-[#E8EAF0]" />
                        <button
                          onClick={() => setReplyImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Image attach */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E8EAF0] hover:bg-[#F7F8FA] transition-colors shrink-0"
                    style={{ color: "#69707D" }}
                    title="Attach image"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <rect x="1" y="2" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="5" cy="5.5" r="1.2" fill="currentColor" />
                      <path d="M1 10.5l3.5-3.5L7 9.5l3-3 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageAttach(e.target.files)}
                  />

                  <textarea
                    rows={1}
                    className="flex-1 border rounded-xl px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#6B9FE5] transition-colors"
                    style={{
                      borderColor: "#E8EAF0", color: "#25205B", lineHeight: "1.5",
                      overflow: "hidden",
                    }}
                    placeholder="Type a message…"
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() && replyImages.length === 0}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-35 transition-opacity shrink-0"
                    style={{ background: "#25205B" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M2 7.5h10M9 3.5l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] mt-1.5 text-center" style={{ color: "#C4C9D4" }}>Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#EAF2FC" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M4 4h24v18H16L9 26v-4H4V4z" stroke="#6B9FE5" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 11h14M9 15.5h9" stroke="#6B9FE5" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold" style={{ color: "#374151" }}>Select a conversation</p>
                <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>or start a new one to message any staff member</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: "#25205B" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.7" strokeLinecap="round" /></svg>
                New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewConversationModal currentUser={currentUser} onClose={() => setShowModal(false)} onSend={handleNewConv} />
      )}
    </div>
  );
}
