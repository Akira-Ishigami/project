import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Message as SupabaseMessage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageCircle,
  LogOut,
  Send,
  User,
  Search,
  Menu,
  CheckCheck,
  Tag,
  MoreVertical,
  X,
  Image as ImageIcon,
  Paperclip,
  FileText,
  Loader2,
  Send as SendIcon,
} from 'lucide-react';
import Toast from './Toast';
import { registrarTransferencia } from '../lib/mensagemTransferencia';

import { EmojiPicker } from './EmojiPicker';
import { useRealtimeMessages, useRealtimeContacts } from '../hooks';

type Message = SupabaseMessage & {
  company_id?: string | null;
  department_id?: string | null;
  sector_id?: string | null;
  tag_id?: string | null;
};

interface Contact {
  phoneNumber: string; // normalizado (somente dígitos)
  name: string;
  lastMessage: string;
  lastMessageTime: string; // ISO
  unreadCount: number;
  messages: Message[];
  department_id?: string;
  sector_id?: string;
  company_id?: string;
  tag_ids?: string[];
  contact_db_id?: string;
}

interface ContactDB {
  id: string;
  company_id: string;
  phone_number: string; // pode vir com @s.whatsapp.net
  name: string;
  department_id: string | null;
  sector_id: string | null;
  tag_id: string | null;
  last_message: string | null;
  last_message_time: string | null;
  created_at: string;
  updated_at: string;
  tag_ids?: string[];
  ia_ativada?: boolean | null;
}

interface Sector {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

function normalizePhone(input?: string | null): string {
  if (!input) return '';
  const noJid = input.includes('@') ? input.split('@')[0] : input;
  return noJid.replace(/\D/g, '');
}

// Para consultas no banco (se o número vier sem DDI 55 ou com sufixo @...)
function normalizeDbPhone(input?: string | null): string {
  const digits = normalizePhone(input);
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function safeISO(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export default function AttendantDashboard() {
  const { attendant, company, signOut } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [contactsDB, setContactsDB] = useState<ContactDB[]>([]);
  const [lastViewedMessageTime, setLastViewedMessageTime] = useState<{ [key: string]: number }>({});
  const [pendingMessagesCount, setPendingMessagesCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  const [sector, setSector] = useState<Sector | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  /**
   * =========================================
   * PASSO 3 — CACHE DE DEPARTAMENTOS (ID -> NOME)
   * =========================================
   */
  const departmentsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of departments) map[d.id] = d.name;
    return map;
  }, [departments]);

  const [selectedContact, setSelectedContact] = useState<string | null>(null); // phone normalizado
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  type FilterMode = 'mine' | 'all';
  const [filterMode, setFilterMode] = useState<FilterMode>('mine');

  const [modalContactPhone, setModalContactPhone] = useState<string | null>(null); // phone normalizado
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [departamentoTransferencia, setDepartamentoTransferencia] = useState<string>('');

  const [transferindo, setTransferindo] = useState(false);
  const [showTransferSuccessModal, setShowTransferSuccessModal] = useState(false);
  const [transferSuccessData, setTransferSuccessData] = useState<{
    id?: string;
    api_key?: string;
    numero_contato?: number;
    nome_contato?: string;
    departamento_origem?: string;
    departamento_destino?: string;
    data_transferencia?: string;
    nomedept?: string;
    nomecontato?: string;
  } | null>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [iaAtivada, setIaAtivada] = useState(false);
  const [togglingIa, setTogglingIa] = useState(false);

  const [imageCaption, setImageCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [imageModalType, setImageModalType] = useState<'image' | 'sticker' | 'video'>('image');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const isUserScrollingRef = useRef(false);
  const lastContactsRefetchAt = useRef<number>(0);

  // Cache para evitar múltiplas buscas no fallback de contatos
  const fetchedPhonesRef = useRef<Set<string>>(new Set());

  const fetchAndCacheContactByPhone = useCallback(async (phone: string) => {
    const phoneNormalized = normalizeDbPhone(phone);
    if (!phoneNormalized || !company?.id) return;
    if (fetchedPhonesRef.current.has(phoneNormalized)) return;
    fetchedPhonesRef.current.add(phoneNormalized);

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', company.id)
        .eq('phone_number', phoneNormalized)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar contato (fallback):', error);
        return;
      }

      if (data) {
        const withTags = { ...data, tag_ids: (data as any).tag_ids ?? [] } as ContactDB;

        setContactsDB(prev => {
          if (prev.some(c => c.id === withTags.id)) return prev.map(c => c.id === withTags.id ? withTags : c);
          return [...prev, withTags];
        });
      }
    } catch (e) {
      console.error('Erro inesperado ao buscar contato (fallback):', e);
    }
  }, [company?.id]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePasteContent = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Se for imagem
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setSelectedFile(file);
            setFilePreview(base64);
          };
          reader.readAsDataURL(file);
        }
      }
      // Se for arquivo
      else if (item.kind === 'file') {
        e.preventDefault();
        const file = item.getAsFile();
        if (file && !file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setSelectedFile(file);
            setFilePreview(base64);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const getMessageTypeFromTipomessage = (tipomessage?: string | null): 'image' | 'audio' | 'document' | 'sticker' | 'video' | null => {
    if (!tipomessage) return null;

    const tipo = tipomessage.toLowerCase();

    if (tipo === 'imagemessage' || tipo === 'image') {
      return 'image';
    }

    if (tipo === 'audiomessage' || tipo === 'audio' || tipo === 'ptt') {
      return 'audio';
    }

    if (tipo === 'documentmessage' || tipo === 'document') {
      return 'document';
    }

    if (tipo === 'stickermessage' || tipo === 'sticker') {
      return 'sticker';
    }

    if (tipo === 'videomessage' || tipo === 'video') {
      return 'video';
    }

    return null;
  };

  const normalizeBase64 = (base64: string, type: 'image' | 'audio' | 'document' | 'sticker' | 'video'): string => {
    if (base64.startsWith('data:')) {
      return base64;
    }

    const mimeTypes = {
      image: 'data:image/jpeg;base64,',
      audio: 'data:audio/mpeg;base64,',
      document: 'data:application/pdf;base64,',
      sticker: 'data:image/webp;base64,',
      video: 'data:video/mp4;base64,'
    };

    return mimeTypes[type] + base64;
  };

  const handleAudioPlay = (messageId: string, base64Audio: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audioSrc = normalizeBase64(base64Audio, 'audio');
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      audio.play();
      setPlayingAudio(messageId);

      audio.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const downloadBase64File = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64.startsWith('data:') ? base64 : `data:application/octet-stream;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openImageModal = (src: string, type: 'image' | 'sticker' | 'video' = 'image') => {
    setImageModalSrc(src);
    setImageModalType(type);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setImageModalSrc('');
  };

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    });
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    isUserScrollingRef.current = distanceFromBottom > 100;
    setShowScrollButton(distanceFromBottom > 100);
  };

  useEffect(() => {
    if (!attendant || !company) {
      setLoading(false);
      return;
    }



    let unsub: (() => void) | undefined;

    (async () => {
      setLoading(true);
      await Promise.all([
        fetchSector(),
        fetchDepartments(),
        fetchSectors(),
        fetchTags(),
        fetchContacts(),
        fetchMessages(),
      ]);
      unsub = subscribeToRealtime();
      setLoading(false);
    })();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendant?.id, company?.id]);

// DEV-only diagnostic: inspeciona amostras da tabela `messages` por company_id (sem UI)
useEffect(() => {
  if (!import.meta.env.DEV) return;

  (async () => {
    try {
      const effectiveCompanyId = company?.id ?? attendant?.company_id ?? null;
      if (!effectiveCompanyId) {
        console.log('[DIAG] no effectiveCompanyId');
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, numero, department_id, company_id, apikey_instancia, created_at')
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('[DIAG] messages by company_id', effectiveCompanyId, 'count=', data?.length || 0, 'error=', error || null, 'sample=', data?.slice(0, 3) || []);
    } catch (e) {
      console.error('[DIAG] erro ao inspecionar mensagens', e);
    }
  })();
}, [company?.id, attendant?.company_id]);

  useEffect(() => {
    if (selectedContact) {
      scrollToBottom(false);
      // Resetar o flag de scroll quando muda de contato
      isUserScrollingRef.current = false;
    }
  }, [selectedContact]);

  const fetchSector = async () => {
    if (!attendant?.sector_id) return;
    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name')
        .eq('id', attendant.sector_id)
        .maybeSingle();

      if (!error && data) setSector(data);
    } catch (e) {
      console.error('Erro ao carregar setor:', e);
    }
  };

  const fetchDepartments = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', company.id)
        .order('name');

      if (!error && data) setDepartments(data);
    } catch (e) {
      console.error('Erro ao carregar departamentos:', e);
    }
  };

  const fetchSectors = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name')
        .eq('company_id', company.id)
        .order('name');

      if (!error && data) setSectors(data);
    } catch (e) {
      console.error('Erro ao carregar setores:', e);
    }
  };

  const fetchTags = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('company_id', company.id)
        .order('name');

      if (!error && data) setTags(data);
    } catch (e) {
      console.error('Erro ao carregar tags:', e);
    }
  };

  const fetchContacts = async () => {
    if (!company?.id) return;

    try {
      // Construir query base
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('company_id', company.id);

      // Aplicar filtro de departamento/setor quando filterMode === 'mine'
      if (filterMode === 'mine' && attendant?.department_id) {
        query = query.eq('department_id', attendant.department_id);

        // Se o atendente tem setor específico, filtrar também por setor
        if (attendant?.sector_id) {
          query = query.eq('sector_id', attendant.sector_id);
        }
      }

      const { data, error } = await query.order('last_message_time', { ascending: false });

      if (error) throw error;
      const withTags = (data || []).map((c: ContactDB) => ({ ...c, tag_ids: (c as any).tag_ids ?? [] }));

      setContactsDB(withTags);
    } catch (e) {
      console.error('Erro ao buscar contatos:', e);
    }
  };

  const getMessageTimestamp = (msg: Message): number => {
    if (msg.timestamp && !isNaN(Number(msg.timestamp))) return Number(msg.timestamp) * 1000;
    if (msg.date_time) {
      const t = new Date(msg.date_time).getTime();
      if (!isNaN(t)) return t;
    }
    if (msg.created_at) {
      const t = new Date(msg.created_at).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  const processReactions = (messages: Message[]) => {
    // Extrair reações
    const reactions = messages.filter(m => m.tipomessage === 'reactionMessage');

    if (reactions.length === 0) return messages;



    // Mapear reações por ID da mensagem alvo
    const reactionMap = new Map<string, Array<{ emoji: string; count: number }>>();

    const looksLikeEmoji = (v?: string | null) =>
      !!v && v.length <= 6 && /[^\w\d]/.test(v);

    reactions.forEach(reaction => {
      let targetId = reaction?.reaction_target_id as string | null;
      let emoji = reaction?.message as string | null;

      // ✅ Fallback: se emoji tá em reaction_target_id, swap
      if (looksLikeEmoji(targetId) && !looksLikeEmoji(emoji)) {
        const tmp = targetId;
        targetId = emoji;
        emoji = tmp;
      }

      // ✅ Outros fallbacks
      if (!emoji && looksLikeEmoji(reaction?.caption)) emoji = reaction.caption;
      if (!targetId && reaction?.idmessage) targetId = reaction.idmessage;



      if (!targetId || !emoji) {
        console.warn('⚠️ Reação inválida: falta reaction_target_id ou message', reaction);
        return;
      }

      if (!reactionMap.has(targetId)) {
        reactionMap.set(targetId, []);
      }

      const reactionList = reactionMap.get(targetId)!;
      const existing = reactionList.find(r => r.emoji === emoji);

      if (existing) {
        existing.count++;
      } else {
        reactionList.push({ emoji, count: 1 });
      }
    });



    // Adicionar reações às mensagens originais
    const filtered = messages.filter(m => m.tipomessage !== 'reactionMessage');

    return filtered.map(msg => {
      const msgReactions = (reactionMap.get(msg?.idmessage || '') || reactionMap.get(msg?.message || '') || reactionMap.get(msg?.id || '') || []) as Array<{ emoji: string; count: number }>;

      if (msgReactions.length > 0) {

      }

      return {
        ...msg,
        reactions: msgReactions
      };
    });
  };


const fetchMessages = async () => {
  const effectiveCompanyId = company?.id ?? attendant?.company_id ?? null;

  if (!effectiveCompanyId) {
    setMessages([]);
    setLoading(false);
    return;
  }

  setLoading(true);

  const timeout = setTimeout(() => {
    setLoading(false);
  }, 10000);

  try {
    const [receivedResult, sentResult] = await Promise.all([
      supabase.from('messages').select('*').eq('company_id', effectiveCompanyId).order('created_at', { ascending: true }),
      supabase.from('sent_messages').select('*').eq('company_id', effectiveCompanyId).order('created_at', { ascending: true }),
    ]);

    clearTimeout(timeout);

    if (receivedResult.error) throw receivedResult.error;
    if (sentResult.error) throw sentResult.error;

    let allMessages: Message[] = [
      ...(receivedResult.data || []),
      ...(sentResult.data || []),
    ].sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));

    allMessages = allMessages.filter(m => !m.company_id || m.company_id === effectiveCompanyId);

    const messagesWithReactions = processReactions(allMessages);

    setMessages(messagesWithReactions);
    setTimeout(scrollToBottom, 50);
  } catch (e) {
    console.error('Erro ao carregar mensagens:', e);
    setMessages([]);
  } finally {
    setLoading(false);
  }
};


const subscribeToRealtime = () => {
  const effectiveCompanyId = company?.id ?? attendant?.company_id ?? null;

  if (!effectiveCompanyId && !import.meta.env.DEV) return;
  if (!effectiveCompanyId && import.meta.env.DEV) {
    console.log('[DEV] subscribing to all messages (no companyId) for testing');
  }

  const channel = supabase
    .channel('attendant-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: effectiveCompanyId ? `company_id=eq.${effectiveCompanyId}` : undefined },
      () => {
        fetchMessages();
        fetchContacts();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sent_messages', filter: effectiveCompanyId ? `company_id=eq.${effectiveCompanyId}` : undefined },
      () => {
        fetchMessages();
        fetchContacts();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contacts', filter: effectiveCompanyId ? `company_id=eq.${effectiveCompanyId}` : undefined },
      () => {
        fetchContacts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

  // Carregar status IA do contato
  useEffect(() => {
    if (!selectedContact || contactsDB.length === 0) return;
    const contact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
    setIaAtivada(contact?.ia_ativada || false);
  }, [selectedContact, contactsDB]);

  // Hook para monitorar mudanças em tempo real nos contatos
  useRealtimeContacts({
    companyId: company?.id,
    enabled: true,
    onContactsChange: (contact: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => {


      const matchesFilter = (() => {
        if (!contact) return false;

        if (filterMode === 'mine') {
          if (!attendant?.department_id) return false;
          if (contact.department_id !== attendant.department_id) return false;
          // Se atendente tem setor e o contato tem setor, validar também
          if (attendant?.sector_id && contact.sector_id && contact.sector_id !== attendant.sector_id) return false;
          return true;
        }

        // 'all' inclui contatos sem department; mantemos retorno true para todos os outros casos
        return true; // 'all' or default
      })();

      setContactsDB((prevContacts) => {
        const contactExists = prevContacts.some(c => c.id === contact.id);

        // Se não bate no filtro e já existia, removemos; se não existia, ignoramos
        if (!matchesFilter) {
          if (contactExists) return prevContacts.filter(c => c.id !== contact.id);
          return prevContacts;
        }

        // Se bate no filtro, aplicamos update/insert normalmente
        if (type === 'DELETE') {
          return prevContacts.filter(c => c.id !== contact.id);
        }

        if (contactExists) {
          return prevContacts.map(c => c.id === contact.id ? { ...c, ...contact } : c);
        }

        // Novo contato que satisfaz o filtro: inserir contato (tags já vêm em contacts.tag_ids)
        return [...prevContacts, { ...contact, tag_ids: (contact as any).tag_ids ?? [] }];
      });
    }
  });

  // Recarregar contatos quando o filtro do atendente mudar (modo, depto, setor ou lista de departamentos)
  useEffect(() => {
    if (!company?.id) return;
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, attendant?.department_id, attendant?.sector_id, departments, company?.id]);

  const fileToBase64 = (file: File): Promise<string> => {

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ======= AGRUPA CONTATOS A PARTIR DO DB (contacts) E ANEXA MENSAGENS =======
  const contacts: Contact[] = useMemo(() => {
    if (!company?.id) return [];

    const arr = (contactsDB || []).map((db) => {
      const phone = normalizePhone(db.phone_number);

      // Mensagens desta empresa para este contato
      const msgs = messages.filter(m => normalizePhone(m.numero || m.sender || '') === phone && (!m.company_id || m.company_id === company.id));
      msgs.sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));

      const last = msgs[msgs.length - 1] || null;

      const lastMessage = last?.message || db.last_message || 'Mensagem';
      const lastMessageTime = safeISO(last?.date_time || last?.created_at || db.last_message_time) || '';

      // Contar mensagens pendentes (do cliente, não respondidas pelo atendente)
      const lastViewedTime = lastViewedMessageTime[phone] || 0;
      let unread = 0;

      for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i];
        const isSent = msg['minha?'] === 'true';
        const msgTime = getMessageTimestamp(msg);
        if (!isSent && msgTime > lastViewedTime) {
          // verificar resposta após esta mensagem
          let hasResponse = false;
          for (let j = i + 1; j < msgs.length; j++) {
            const responseMsg = msgs[j];
            if (responseMsg['minha?'] === 'true') { hasResponse = true; break; }
          }
          if (!hasResponse) unread++;
        }
      }

      return {
        phoneNumber: phone,
        name: db.name || '',
        lastMessage,
        lastMessageTime,
        unreadCount: unread,
        messages: msgs,
        department_id: db.department_id || undefined,
        sector_id: db.sector_id || undefined,
        company_id: db.company_id || undefined,
        tag_ids: db.tag_ids || [],
        contact_db_id: db.id,
      } as Contact;
    });

    arr.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    // Não adicionamos contatos a partir de mensagens aqui: a lista lateral deve vir apenas de `contacts` (contactsDB).
    return arr;
  }, [contactsDB, messages, lastViewedMessageTime, company?.id, filterMode, attendant?.department_id, fetchAndCacheContactByPhone]);

  const filteredContacts = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();

    // Base -> apenas contatos do DB para a company
    const base = (contacts || []).filter(c => c.company_id === company?.id);

    if (filterMode === 'all') {
      const res = s ? base.filter((c) => c.name.toLowerCase().includes(s) || c.phoneNumber.toLowerCase().includes(s)) : base;
      return res;
    }

    // mine -> somente contatos do mesmo departamento do atendente
    const myDept = attendant?.department_id ?? null;
    if (!myDept) return [];

    const res = base.filter(c => c.department_id === myDept);
    return s ? res.filter((c) => c.name.toLowerCase().includes(s) || c.phoneNumber.toLowerCase().includes(s)) : res;

  }, [contacts, searchTerm, filterMode, attendant?.department_id, company?.id]);

  const selectedContactData = selectedContact ? contacts.find((c) => c.phoneNumber === selectedContact) : null;

  // Auto-selecionar primeiro contato disponível quando não houver seleção
  useEffect(() => {
    if (!selectedContact && filteredContacts.length > 0) {
      setSelectedContact(filteredContacts[0].phoneNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredContacts]);

  // Se seleção atual sumir do filtro, selecionar o primeiro
  useEffect(() => {
    if (!selectedContact) return;
    const exists = filteredContacts.some(c => c.phoneNumber === selectedContact);
    if (!exists) {
      setSelectedContact(filteredContacts[0]?.phoneNumber ?? null);
    }
  }, [filterMode, filteredContacts, selectedContact]);

  // Mensagens do chat (filtradas por contato selecionado)
  const chatMessages = useMemo(() => {
    if (!selectedContact) return [] as Message[];
    const n = normalizePhone(selectedContact);
    return messages.filter(m => normalizePhone(m.numero || m.sender || '') === n).sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
  }, [messages, selectedContact]);

  useEffect(() => {
    if (!selectedContact && contacts.length > 0) setSelectedContact(contacts[0].phoneNumber);
  }, [contacts, selectedContact]);

  // Garantir que o contato selecionado respeite o filtro atual; se não, escolhe o primeiro do resultado
  useEffect(() => {
    if (!filteredContacts || filteredContacts.length === 0) {
      setSelectedContact(null);
      return;
    }
    if (selectedContact && !filteredContacts.some(c => c.phoneNumber === selectedContact)) {
      setSelectedContact(filteredContacts[0].phoneNumber);
    }
  }, [filteredContacts, selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      scrollToBottom(false);
      // Resetar o flag de scroll quando muda de contato
      isUserScrollingRef.current = false;
      // Marcar todas as mensagens como vistas (usando mensagens filtradas do chat)
      if (chatMessages.length > 0) {
        const lastMsgTime = chatMessages.reduce((max, msg) => Math.max(max, getMessageTimestamp(msg)), 0);
        setLastViewedMessageTime(prev => ({
          ...prev,
          [selectedContact]: lastMsgTime
        }));
      }
    }
  }, [selectedContact, selectedContactData?.messages.length]);

  // Contar mensagens pendentes (novas mensagens que não foram vistas)
  useEffect(() => {
    if (!selectedContact || chatMessages.length === 0) {
      setPendingMessagesCount(0);
      return;
    }

    const lastViewedTime = lastViewedMessageTime[selectedContact] || 0;
    const pendingCount = chatMessages.filter(msg => {
      const isSent = msg['minha?'] === 'true';
      const timestamp = msg.timestamp ? new Date(msg.timestamp).getTime() : msg.created_at ? new Date(msg.created_at).getTime() : 0;
      return !isSent && timestamp > lastViewedTime;
    }).length;

    setPendingMessagesCount(pendingCount);
  }, [messages, selectedContact, chatMessages, lastViewedMessageTime]);

  // Bloquear envio se departamento não bater e setar banner/estado
  const [sendBlocked, setSendBlocked] = useState(false);
  const [blockedBannerMessage, setBlockedBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedContact) {
      setSendBlocked(false);
      setBlockedBannerMessage(null);
      return;
    }

    const contactDb = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
    const contactDept = contactDb?.department_id ?? null;

    // Regras: Se houver mismatch de company_id -> bloquear
    if (contactDb?.company_id && company?.id && contactDb.company_id !== company.id) {
      setSendBlocked(true);
      setBlockedBannerMessage('Contato pertence a outra empresa. Envio bloqueado.');
      return;
    }

    // Se atendente tem department_id e contato tem department_id e não coincidem -> bloquear
    if (attendant?.department_id && contactDept && contactDept !== attendant.department_id) {
      setSendBlocked(true);
      setBlockedBannerMessage('Você não pode enviar mensagem: esta conversa pertence a outro departamento. Solicite transferência.');
      return;
    }

    // Caso contrário, permitir envio
    setSendBlocked(false);
    setBlockedBannerMessage(null);
  }, [selectedContact, contactsDB, attendant?.department_id]);

  const formatTime = (timestamp: string | null, createdAt: string) => {
    const base = timestamp || createdAt;
    if (!base) return '';
    try {
      const d = new Date(base);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const num = parseInt(timestamp || '0', 10);
      if (!isNaN(num) && num > 0)
        return new Date(num * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return '';
    } catch {
      return '';
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const y = new Date();
      y.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return 'Hoje';
      if (d.toDateString() === y.toDateString()) return 'Ontem';

      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: Record<string, Message[]> = {};
    for (const m of msgs) {
      const t = getMessageTimestamp(m);
      const iso = t ? new Date(t).toISOString() : m.created_at || new Date().toISOString();
      const label = formatDateLabel(iso);
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    }
    return groups;
  };

  /**
   * =========================================
   * PASSO 3 — NOME DO DEPARTAMENTO
   * =========================================
   */


  // ======= ATUALIZAR TAGS DO CONTATO =======
  const handleUpdateContactInfo = async () => {
    if (!modalContactPhone || !company?.id) return;

    try {
      const contactDB = contactsDB.find((c) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(modalContactPhone));
      if (!contactDB) throw new Error('Contato não encontrado no DB');

      const currentTags = contactDB.tag_ids || [];
      const changed = selectedTags.length !== currentTags.length || !selectedTags.every((t) => currentTags.includes(t));

      if (!changed) {
        setToastMessage('Nenhuma alteração foi feita');
        setShowToast(true);
        return;
      }

      // Calcular diffs entre tags atuais e as selecionadas
      const toAdd = selectedTags.filter(id => !currentTags.includes(id));
      const toRemove = currentTags.filter(id => !selectedTags.includes(id));

      console.log('[TAGS] Atualizando tags para contato:', contactDB.id, { currentTags, selectedTags, toAdd, toRemove });

      // Usar RPC atômica no banco para aplicar diffs e garantir permissões/consistência.
      // Se a RPC não existir ou falhar por não existir (migration não aplicada), fazemos fallback para lógica cliente (deleta/inserir)
      let rpcInvoked = false;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_contact_tags', { p_contact_id: contactDB.id, p_tag_ids: selectedTags });
        rpcInvoked = true;
        if (rpcError) {
          console.error('[TAGS] Erro RPC update_contact_tags:', rpcError);
          setToastMessage(`Erro ao atualizar tags: ${rpcError.message || String(rpcError)}`);
          setShowToast(true);
          // Se o erro indica que a função não existe, vamos para o fallback; senão, rethrow
          const msg = String(rpcError?.message || '').toLowerCase();
          const notFound = msg.includes('function') && msg.includes('does not exist');
          if (!notFound) throw rpcError;
        }

        console.log('[TAGS] RPC update_contact_tags result:', rpcData);

        if (rpcData && rpcData.success === false) {
          console.error('[TAGS] RPC erro lógico:', rpcData);
          setToastMessage(`Erro ao atualizar tags: ${rpcData.error || JSON.stringify(rpcData)}`);
          setShowToast(true);
          // Se for forbidden, provavelmente políticas RLS — abortar e mostrar erro
          if (rpcData.error === 'forbidden') throw new Error('forbidden');
          // Caso contrário, permitir fallback
        } else {
          // RPC executou com sucesso — atualizar lista local e encerrar
          fetchContacts();
        }
      } catch (rpcEx) {
        if (rpcInvoked) {
          // RPC existe mas falhou com erro diferente de 'function not found' — abortar
          console.error('[TAGS] RPC falhou:', rpcEx);
          throw rpcEx;
        }

        // RPC não existe — usar fallback cliente
        console.warn('[TAGS] RPC update_contact_tags não encontrada — usando fallback cliente (delete/insert).');

        // Deletar somente as tags desmarcadas
        if (toRemove.length > 0) {
          if (delError) {
            console.error('[TAGS] Erro ao deletar tags desmarcadas (fallback):', delError, { toRemove });
            setToastMessage(`Erro ao deletar tags: ${delError.message || String(delError)}`);
            setShowToast(true);
            throw delError;
          }
          console.log('[TAGS] (fallback) Linhas deletadas (contact_tags):', delData);
        }

        // Inserir somente as novas tags, respeitando limite de 5 por contato
        if (toAdd.length > 0) {
          const existingCount = currentTags.length - toRemove.length; // já removemos as desmarcadas
          const allowed = Math.max(0, 5 - existingCount);
          const toInsert = toAdd.slice(0, allowed);
          if (toInsert.length > 0) {
            const payload = toInsert.map(tagId => ({ contact_id: contactDB.id, tag_id: tagId }));
            if (insError) {
              console.error('[TAGS] Erro ao inserir novas tags (fallback):', insError, { payload });
              setToastMessage(`Erro ao inserir tags: ${insError.message || String(insError)}`);
              setShowToast(true);
              throw insError;
            }
            console.log('[TAGS] (fallback) Linhas inseridas (contact_tags):', insData);
          } else {
            console.log('[TAGS] (fallback) Nenhuma tag nova permitida (limite atingido) - allowed:', allowed);
          }
        }

        // Atualizar campo legacy `contacts.tag_id` para refletir primeira tag (ou NULL)
        const contactTagToSet = selectedTags.length > 0 ? selectedTags[0] : null;
        const { data: updData, error: updateError } = await supabase.from('contacts').update({ tag_id: contactTagToSet }).eq('id', contactDB.id);
        if (updateError) {
          console.warn('Aviso: não foi possível atualizar contacts.tag_id (fallback):', updateError);
        } else {
          console.log('[TAGS] (fallback) contacts.tag_id atualizado:', updData);
        }

        fetchContacts();
      }

      setToastMessage('Tags atualizadas com sucesso!');
      setShowToast(true);
      setShowTagsModal(false);
      setModalContactPhone(null);
      setSelectedTags([]);
      fetchContacts();
    } catch (e) {
      console.error('Erro ao atualizar tags:', e);
      setToastMessage('Erro ao atualizar tags');
      setShowToast(true);
    }
  };

  // ======= ENVIO DE MENSAGEM + WEBHOOK COM DEPARTAMENTO =======
  const sendMessage = async (messageData: Partial<Message>) => {
    if (!company?.id || !selectedContact) return;

    // Validação: impedir envio se o contato não pertencer ao mesmo departamento ou empresa do atendente
    const contactDB = contactsDB.find((c) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
    const lastMsg = chatMessages[chatMessages.length - 1] || null;
    const contactDept = contactDB?.department_id || selectedContactData?.department_id || lastMsg?.department_id || null;
    const contactCompany = contactDB?.company_id || selectedContactData?.company_id || lastMsg?.company_id || null;

    if (attendant?.department_id && contactDept !== attendant.department_id) {
      setToastMessage('Contato não pertence ao seu departamento. Envio bloqueado.');
      setShowToast(true);
      return;
    }

    if (company?.id && contactCompany && contactCompany !== company.id) {
      setToastMessage('Contato pertence a outra empresa. Envio bloqueado.');
      setShowToast(true);
      return;
    }

    setSending(true);
    try {
      const generatedIdMessage = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('instancia, department_id, sector_id, tag_id')
        .eq('company_id', company.id)
        .eq('numero', selectedContact)
        .order('created_at', { ascending: false })
        .limit(1);


      const instanciaValue = lastMsg?.[0]?.instancia || company.name;
      const departmentId = lastMsg?.[0]?.department_id ?? attendant?.department_id ?? null;
      const sectorId = lastMsg?.[0]?.sector_id ?? attendant?.sector_id ?? null;
      const tagId = lastMsg?.[0]?.tag_id ?? null;

      const nowIso = new Date().toISOString();

      const rowToInsert: Partial<Message> = {
        numero: selectedContact,
        sender: selectedContact,
        minha: 'true',
        pushname: attendant?.name || company.name,
        date_time: nowIso,
        timestamp: nowIso,
        instancia: instanciaValue,
        idmessage: generatedIdMessage,
        company_id: company.id,
        department_id: departmentId,
        sector_id: sectorId,
        tag_id: tagId,
        created_at: nowIso,
        tipomessage: messageData.tipomessage || 'conversation',
        message: messageData.message || '',
        mimetype: messageData.mimetype || null,
        base64: messageData.base64 || null,
        urlpdf: messageData.urlpdf || null,
        urlimagem: messageData.urlimagem || null,
        caption: messageData.caption || null,
      };



      const { error } = await supabase.from('sent_messages').insert([rowToInsert]);
      if (error) throw error;

      // formatação do conteúdo (mantive)
      let formattedMessage = rowToInsert.message || '';
      // @ts-ignore
      if (attendant?.function && rowToInsert.tipomessage === 'conversation') {
        // @ts-ignore
        formattedMessage = `(${attendant.function}) - ${attendant.name}\n${formattedMessage}`;
      }

      let formattedCaption = rowToInsert.caption || null;
      // @ts-ignore
      if (attendant?.function && formattedCaption && rowToInsert.tipomessage !== 'conversation') {
        // @ts-ignore
        formattedCaption = `(${attendant.function}) - ${attendant.name}\n${formattedCaption}`;
      }

      const webhookPayload = {
        numero: selectedContact,
        message: formattedMessage,
        tipomessage: rowToInsert.tipomessage || 'conversation',
        base64: rowToInsert.base64 || null,
        urlimagem: rowToInsert.urlimagem || null,
        urlpdf: rowToInsert.urlpdf || null,
        caption: formattedCaption,
        idmessage: generatedIdMessage,
        pushname: attendant?.name || company.name,
        timestamp: nowIso,
        instancia: instanciaValue,
        apikey_instancia: attendant?.apikey_instancia ?? null,

        sender_type: 'attendant',
        attendant_id: attendant?.id || null,
        attendant_name: attendant?.name || null,

        department_id: attendant?.department_id || null,
        department_name: attendant?.department_id ? (departmentsMap[attendant.department_id] || null) : null,

        sector_id: attendant?.sector_id || null,
        sector_name: sectors.find((s) => s.id === attendant?.sector_id)?.name || null,

        company_id: company.id,
        company_name: company.name,
      };

      try {
        const res = await fetch('https://n8n.nexladesenvolvimento.com.br/webhook/EnvioMensagemOPS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });

        if (!res.ok) console.error('Webhook falhou:', res.status);
      } catch (e) {
        console.error('Erro ao chamar webhook:', e);
      }

      setMessageText('');
      setTimeout(scrollToBottom, 50);
      fetchMessages();
      fetchContacts();
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Toggle IA para contato
  const handleToggleIa = async () => {
    if (!selectedContact || !company) return;
    try {
      setTogglingIa(true);
      const contact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
      if (!contact) return;

      const newStatus = !iaAtivada;
      const { error } = await supabase
        .from('contacts')
        .update({ ia_ativada: newStatus })
        .eq('id', contact.id);

      if (error) {
        console.error('Erro ao toggle IA:', error);
        setToastMessage('❌ Erro ao alterar IA');
        setShowToast(true);
        return;
      }

      setIaAtivada(newStatus);
      setToastMessage(`✅ IA ${newStatus ? 'Ativada' : 'Desativada'}`);
      setShowToast(true);
    } catch (err) {
      console.error('Erro ao toggle IA:', err);
      setToastMessage('❌ Erro ao alterar IA');
      setShowToast(true);
    } finally {
      setTogglingIa(false);
    }
  };

  const handleTransferir = async () => {
    if (!selectedContact || !attendant?.company_id || !attendant?.apikey_instancia) {
      setToastMessage('❌ Erro: Contato ou empresa não identificados');
      setShowToast(true);
      return;
    }

    if (!departamentoTransferencia || departamentoTransferencia.trim() === '') {
      setToastMessage('⚠️ Selecione um departamento de destino');
      setShowToast(true);
      return;
    }

    const currentContact = contacts.find(c => c.phoneNumber === selectedContact);
    if (!currentContact) {
      setToastMessage('❌ Erro: Contato não encontrado');
      setShowToast(true);
      return;
    }

    setTransferindo(true);

    try {
      console.log('[TRANSFERÊNCIA ATD 1] Iniciando transferência', {
        numeroContato: selectedContact,
        nomeContato: currentContact.name,
        departamentoDestino: departmentsMap[departamentoTransferencia] || departamentoTransferencia,
        apiKey: attendant.apikey_instancia
      });

      const contactDb = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
      const contactId = contactDb?.id || (currentContact as any).contact_db_id;
      if (!contactId) {
        setToastMessage('❌ Erro: ID do contato não encontrado no banco');
        setShowToast(true);
        return;
      }

      const deptDestinoId = departamentoTransferencia; // agora é UUID


      const deptOrigemId = (contactDb?.department_id ?? (currentContact as any).department_id ?? null) as any;

      // 1) Atualiza o departamento do contato no banco (roteamento)
      const { error: updErr } = await supabase
        .from('contacts')
        .update({ department_id: deptDestinoId })
        .eq('id', contactId);

      if (updErr) {
        console.warn('[TRANSFERÊNCIA ATD] Aviso: falha ao atualizar departamento do contato:', updErr);
      }

      // 2) Registra a transferência (histórico)
      const dadosTransferencia = {
        api_key: attendant.apikey_instancia,
        contact_id: contactId,
        departamento_origem_id: deptOrigemId,
        departamento_destino_id: deptDestinoId,
      };

      console.log('[TRANSFERÊNCIA ATD 1.5] Dados a enviar para RPC:', dadosTransferencia);

      const resultado = await registrarTransferencia(dadosTransferencia);

      console.log('[TRANSFERÊNCIA ATD 2] Resultado da RPC:', resultado);
      console.log('[TRANSFERÊNCIA ATD 2.1] Sucesso?', resultado.sucesso);
      console.log('[TRANSFERÊNCIA ATD 2.2] Dados retornados:', resultado.data);

      if (resultado.sucesso) {
        console.log('[TRANSFERÊNCIA ATD 3] ✅ Transferência registrada com sucesso:', resultado.data);

        // Mostrar modal de sucesso com todos os dados da transferência
        setTransferSuccessData({
          ...resultado.data,
          nomedept: departmentsMap[departamentoTransferencia] || departamentoTransferencia,
          nomecontato: currentContact.name
        });
        setShowTransferSuccessModal(true);

        setToastMessage(`✅ Contato transferido para ${departmentsMap[departamentoTransferencia] || 'Departamento'}`);
        setShowToast(true);
        setDepartamentoTransferencia('');
        setMessageText('');
      } else {
        console.error('[TRANSFERÊNCIA ATD 3] ❌ Erro ao registrar:', resultado.erro);
        setToastMessage(`❌ Erro: ${resultado.erro}`);
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('[TRANSFERÊNCIA ATD 4] ❌ Erro ao transferir - Exceção:', error);
      console.error('[TRANSFERÊNCIA ATD 4.1] Stack:', error.stack);
      setToastMessage(`❌ Erro ao transferir: ${error.message}`);
      setShowToast(true);
    } finally {
      setTransferindo(false);
    }
  };

  const handleSendMessage = async () => {
    if (sending) return;
    if (sendBlocked) {
      setToastMessage('Você não pode enviar mensagem: esta conversa pertence a outro departamento. Solicite transferência.');
      setShowToast(true);
      return;
    }
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        const isImage = selectedFile.type.startsWith('image/');
        const isAudio = selectedFile.type.startsWith('audio/');

        const messageData: Partial<Message> = {
          tipomessage: isImage ? 'imageMessage' : isAudio ? 'audioMessage' : 'documentMessage',
          mimetype: selectedFile.type,
          base64,
        };

        if (isImage) {
          messageData.message = messageText.trim() || 'Imagem';
          if (imageCaption) messageData.caption = imageCaption;
        } else if (isAudio) {
          messageData.message = messageText.trim() || 'Áudio';
        } else {
          messageData.message = messageText.trim() || selectedFile.name;
        }

        await sendMessage(messageData);
        setSelectedFile(null);
        setFilePreview(null);
        setImageCaption('');
      } else {
        await sendMessage({
          message: messageText.trim(),
          tipomessage: 'conversation',
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(null);
    }
    e.target.value = '';
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setImageCaption('');
  };

  if (loading) {
    return (
      <div className="h-screen flex bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando chat...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMessages = chatMessages;
  const messageGroups = groupMessagesByDate(currentMessages);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}

      {/* Fixed Header */}
      <header className="bg-white border-b-2 border-gray-300 z-50">
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 font-semibold text-base">{attendant?.name}</h1>
              <p className="text-xs text-gray-500">{sector ? `Setor: ${sector.name}` : company?.name}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>



      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div
          className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-[320px] bg-white border-r-2 border-gray-300 flex-col`}
        >
          <div className="px-4 py-3 border-b-2 border-gray-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar contato"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-sky-500 focus:bg-white transition-all placeholder-gray-400"
              />
            </div>

            <div className="mt-3 flex gap-2 flex-wrap items-center">
              <button
                onClick={() => setFilterMode('mine')}
                className={`px-2.5 py-1 rounded-full text-sm font-medium transition transform enabled:hover:-translate-y-0.5 ${filterMode === 'mine' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' : 'bg-white border border-blue-100 text-gray-700 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1`}>
                Meu Departamento
              </button>



              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-full text-sm font-medium transition transform enabled:hover:-translate-y-0.5 ${filterMode === 'all' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' : 'bg-white border border-blue-100 text-gray-700 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1`}>
                Todos
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-transparent">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-gray-500 text-sm text-center font-medium">
                  {searchTerm ? 'Nenhum contato encontrado' : 'Nenhuma conversa ainda'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.phoneNumber}
                    onClick={() => {
                      setSelectedContact(contact.phoneNumber);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full px-3 py-3 flex items-center gap-3 rounded-lg transition-all ${selectedContact === contact.phoneNumber
                      ? 'bg-sky-50 border-2 border-sky-500 shadow-md'
                      : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <div className="w-11 h-11 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-gray-900 font-semibold text-sm truncate">{contact.name}</h3>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatTime(contact.lastMessageTime, contact.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-xs truncate flex-1">{contact.lastMessage}</p>
                        {contact.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                            <span className="text-[10px] font-bold text-white">{contact.unreadCount}</span>
                          </div>
                        )}
                      </div>

                      {contact.tag_ids && contact.tag_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {contact.tag_ids.map((tagId) => {
                            const t = tags.find((x) => x.id === tagId);
                            return t ? (
                              <span
                                key={tagId}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                                style={{ backgroundColor: t.color }}
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {t.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CHAT */}
        <div className={`flex-1 flex-col ${sidebarOpen ? 'hidden md:flex' : 'flex'} bg-white`}>
          {selectedContactData ? (
            <>
              {/* Chat Header */}
              <header className="bg-white border-b-2 border-gray-300">
                <div className="px-6 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div>
                        <h1 className="text-gray-900 font-bold text-base">{selectedContactData.name}</h1>
                        <p className="text-gray-500 text-xs">{selectedContactData.phoneNumber}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${iaAtivada
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          IA: {iaAtivada ? 'Ativada ✅' : 'Desativada ❌'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleIa}
                      disabled={togglingIa}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                      title={iaAtivada ? 'Desativar IA' : 'Ativar IA'}
                    >
                      {togglingIa ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreVertical className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Transferir departamento"
                    >
                      <SendIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => {
                        if (!selectedContact) return;
                        const contactDB = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
                        setSelectedTags(contactDB?.tag_ids || []);
                        setModalContactPhone(selectedContact);
                        setShowTagsModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-all"
                      title="Editar tags"
                    >
                      <Tag className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 text-gray-500 hover:text-gray-700 md:hidden"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </header>

              {/* Transfer Modal */}
              {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-4">
                      <SendIcon className="w-6 h-6 text-amber-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                      Transferir Contato
                    </h2>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-xs font-medium text-gray-500 mb-1">Contato:</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedContactData?.name}</p>
                      <p className="text-sm text-gray-600">{selectedContactData?.phoneNumber}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <label className="block text-sm font-semibold text-gray-700">Departamento Destino</label>
                      <select
                        value={departamentoTransferencia}
                        onChange={(e) => setDepartamentoTransferencia(e.target.value)}
                        disabled={transferindo}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 font-medium disabled:opacity-50 transition-all"
                      >
                        <option value="">Selecione um departamento...</option>
                        {departments.map((dept) => {
                          const currentContact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
                          const currentDeptId = currentContact?.department_id;

                          return (
                            <option key={dept.id} value={dept.id} disabled={dept.id === currentDeptId}>
                              {dept.name} {dept.id === currentDeptId ? '(departamento atual)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {departamentoTransferencia && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✅ Será transferido para: <span className="font-semibold">{departmentsMap[departamentoTransferencia] || 'Departamento'}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowTransferModal(false);
                          setDepartamentoTransferencia('');
                        }}
                        disabled={transferindo}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          await handleTransferir();
                          setShowTransferModal(false);
                        }}
                        disabled={transferindo || !departamentoTransferencia}
                        className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {transferindo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Transferindo...
                          </>
                        ) : (
                          <>
                            <SendIcon className="w-4 h-4" />
                            Transferir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags Modal */}
              {showTagsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Editar Tags</h3>
                    <p className="text-sm text-gray-500 mb-4">Selecione até 5 tags para este contato</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-auto mb-4">
                      {tags.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 p-2 border rounded-lg hover:shadow-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags(prev => prev.includes(t.id) ? prev : [...prev, t.id].slice(0, 5));
                              } else {
                                setSelectedTags(prev => prev.filter(id => id !== t.id));
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-gray-800">{t.name}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowTagsModal(false);
                          setModalContactPhone(null);
                          setSelectedTags([]);
                        }}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={async () => {
                          await handleUpdateContactInfo();
                        }}
                        className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Success Modal */}
              {showTransferSuccessModal && transferSuccessData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 p-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                      Transferência Registrada! ✅
                    </h2>

                    <p className="text-sm text-gray-600 mb-6 text-center">Dados salvos no banco de dados</p>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-4 mb-6 border border-gray-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Contato</p>
                        <p className="text-base font-bold text-gray-900">{transferSuccessData.nomecontato}</p>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Número do Contato</p>
                        <p className="text-base font-mono text-gray-900">{transferSuccessData.numero_contato || transferSuccessData.nome_contato}</p>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Departamento De Origem</p>
                        <p className="text-base font-bold text-gray-700">{transferSuccessData.departamento_origem}</p>
                      </div>

                      <div className="border-t border-gray-200 pt-3 bg-green-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 uppercase mb-1">Departamento Destino</p>
                        <p className="text-lg font-bold text-green-700">{transferSuccessData.departamento_destino || transferSuccessData.nomedept}</p>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Data da Transferência</p>
                        <p className="text-sm text-gray-600">
                          {transferSuccessData.data_transferencia
                            ? new Date(transferSuccessData.data_transferencia).toLocaleString('pt-BR')
                            : new Date().toLocaleString('pt-BR')
                          }
                        </p>
                      </div>

                      {transferSuccessData.id && (
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">ID do Registro</p>
                          <p className="text-xs font-mono text-gray-500 break-all">{transferSuccessData.id}</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-6 text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
                      📊 Todos os dados foram salvos na tabela <strong>transferencias</strong> para análise futura.
                    </p>

                    <button
                      onClick={() => {
                        setShowTransferSuccessModal(false);
                        setTransferSuccessData(null);
                      }}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
                <div className="w-full">
                  {Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date} className="mb-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-white px-3 py-1 rounded-full border border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">{date}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {msgs.map((msg) => {
                          // Renderizar mensagens de sistema (transferência de departamento)
                          if (msg.message_type === 'system_transfer') {
                            return (
                              <div key={msg.id} className="flex justify-center my-4">
                                <div className="bg-gray-100 rounded-lg px-4 py-2 text-center max-w-sm">
                                  <p className="text-gray-600 text-sm font-medium">
                                    📋 {msg.message}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (msg.tipomessage === 'system_notification') {
                            return (
                              <div key={msg.id} className="flex justify-center my-4">
                                <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-center">
                                  <p className="text-sm text-blue-700 font-medium">{msg.message}</p>
                                </div>
                              </div>
                            );
                          }

                          const isSentMessage = msg['minha?'] === 'true';
                          // Para mensagens recebidas mostramos apenas o nome do contacts (se existir)
                          const contactForLabel = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(normalizePhone(msg.numero || msg.sender || '')));
                          const senderLabel = isSentMessage ? (msg.pushname || attendant?.name || '') : (contactForLabel?.name || '');
                          const tipoFromField = getMessageTypeFromTipomessage(msg.tipomessage);
                          const hasBase64Content = msg.base64;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSentMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl ${isSentMessage
                                  ? 'bg-sky-500 text-white rounded-br-sm shadow-md'
                                  : 'bg-white text-gray-900 rounded-bl-sm border-2 border-gray-300 shadow-md'
                                  }`}
                              >
                                <div className="px-3.5 pt-2 pb-1">
                                  <span className={`text-xs font-semibold ${isSentMessage ? 'text-white' : 'text-gray-900'}`}>
                                    {senderLabel}
                                  </span>
                                </div>

                                {hasBase64Content && (tipoFromField === 'image') && (
                                  <div className="p-1">
                                    <img
                                      src={normalizeBase64(msg.base64!, 'image')}
                                      alt="Imagem"
                                      className="rounded-xl max-w-full h-auto cursor-pointer hover:opacity-95 transition"
                                      style={{ maxHeight: '300px' }}
                                      onClick={() => openImageModal(normalizeBase64(msg.base64!, 'image'), 'image')}
                                    />
                                    {msg.caption && (
                                      <div className="mt-2 px-2 text-sm">
                                        {msg.caption}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {hasBase64Content && (tipoFromField === 'sticker') && (
                                  <div className="p-2">
                                    <img
                                      src={normalizeBase64(msg.base64!, 'sticker')}
                                      alt="Figurinha"
                                      className="rounded-lg max-w-[250px] h-auto cursor-pointer hover:opacity-90 transition"
                                      style={{ maxHeight: '250px' }}
                                      onClick={() => openImageModal(normalizeBase64(msg.base64!, 'sticker'), 'sticker')}
                                    />
                                  </div>
                                )}

                                {hasBase64Content && (tipoFromField === 'video') && (
                                  <div
                                    className="p-1 relative group cursor-pointer"
                                    onClick={() => openImageModal(normalizeBase64(msg.base64!, 'video'), 'video')}
                                  >
                                    <video
                                      src={normalizeBase64(msg.base64!, 'video')}
                                      className="rounded-xl max-w-full h-auto"
                                      style={{ maxHeight: '300px' }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-500 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {hasBase64Content && (tipoFromField === 'audio') && (
                                  <div className="p-3">
                                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isSentMessage ? 'bg-blue-600' : 'bg-gray-50'
                                      }`}>
                                      <button
                                        onClick={() => handleAudioPlay(msg.id || '', msg.base64!)}
                                        className={`p-2 rounded-full ${isSentMessage ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'
                                          } transition`}
                                      >
                                        {playingAudio === msg.id ? (
                                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 3a2 2 0 00-2 2v10a2 2 0 002 2h9a2 2 0 002-2V5a2 2 0 00-2-2h-9zm3 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"></path></svg>
                                        ) : (
                                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">
                                          {msg.message || 'Áudio'}
                                        </p>
                                        <p className={`text-[11px] ${isSentMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                          Clique para {playingAudio === msg.id ? 'pausar' : 'reproduzir'}
                                        </p>
                                      </div>
                                      <svg className={`w-5 h-5 ${isSentMessage ? 'text-blue-100' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"></path></svg>
                                    </div>
                                  </div>
                                )}

                                {hasBase64Content &&
                                  tipoFromField !== 'audio' &&
                                  tipoFromField !== 'image' &&
                                  tipoFromField !== 'sticker' &&
                                  tipoFromField !== 'video' && (
                                    <div className="p-2">
                                      <button
                                        onClick={() => downloadBase64File(msg.base64!, msg.message || 'documento.pdf')}
                                        className={`flex items-center gap-2 p-2.5 rounded-xl w-full ${isSentMessage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 hover:bg-gray-100'
                                          } transition`}
                                      >
                                        <FileText className="w-8 h-8 flex-shrink-0" />
                                        <div className="flex-1 min-w-0 text-left">
                                          <p className="text-sm font-medium truncate">
                                            {msg.message || 'Documento'}
                                          </p>
                                          <p className={`text-[11px] ${isSentMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                            Clique para baixar
                                          </p>
                                        </div>
                                      </button>
                                    </div>
                                  )}

                                {msg.message && !hasBase64Content && (
                                  <div className="px-3.5 py-2">
                                    <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                                      {msg.message}
                                    </p>
                                  </div>
                                )}

                                <div className="px-3.5 pb-1.5 flex items-center justify-end gap-1">
                                  <span className={`text-[10px] ${isSentMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {formatTime(msg.timestamp, msg.created_at)}
                                  </span>
                                  {isSentMessage && (
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-50" />
                                  )}
                                </div>

                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="px-3.5 pb-2 flex flex-wrap gap-1">
                                    {msg.reactions.map((reaction, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1 text-sm"
                                      >
                                        <span>{reaction.emoji}</span>
                                        {reaction.count > 1 && (
                                          <span className="text-xs text-gray-600 font-medium">{reaction.count}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Botão flutuante para ir para baixo com contador de mensagens pendentes */}
              {showScrollButton && (
                <button
                  onClick={() => {
                    scrollToBottom(true);
                    setPendingMessagesCount(0);
                    // Marcar como visto
                    if (chatMessages.length > 0) {
                      const lastMsgTime = chatMessages.reduce((max, msg) => {
                        return Math.max(max, msg.timestamp ? new Date(msg.timestamp).getTime() : msg.created_at ? new Date(msg.created_at).getTime() : 0);
                      }, 0);
                      setLastViewedMessageTime(prev => ({
                        ...prev,
                        [selectedContact!]: lastMsgTime
                      }));
                    }
                  }}
                  className="fixed bottom-24 right-8 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-3 shadow-lg transition-all flex items-center justify-center"
                  style={{ zIndex: 40 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {pendingMessagesCount > 0 && (
                      <span className="text-xs font-bold bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingMessagesCount > 9 ? '9+' : pendingMessagesCount}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="max-w-4xl mx-auto space-y-3">
                  {sendBlocked && blockedBannerMessage && (
                    <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {blockedBannerMessage}
                    </div>
                  )}

                  {filePreview && (
                    <div className="relative inline-block">
                      <img src={filePreview} alt="preview" className="h-24 rounded-lg" />
                      <button
                        onClick={clearSelectedFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        disabled={sendBlocked}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className={`p-2.5 text-sky-500 hover:bg-sky-50 rounded-lg transition-all ${sendBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={sendBlocked}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2.5 text-sky-500 hover:bg-sky-50 rounded-lg transition-all ${sendBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={sendBlocked}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={sendBlocked}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={sendBlocked}
                    />

                    <input
                      ref={messageInputRef}
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onPaste={handlePasteContent}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && messageText.trim() && !sendBlocked) {
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem (ou cole imagem/arquivo)..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-900 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                      disabled={sending || sendBlocked}
                    />

                    <EmojiPicker
                      onSelect={(emoji) => setMessageText(prev => prev + emoji)}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={sending || (!messageText.trim() && !selectedFile) || sendBlocked}
                      className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecione um contato para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Imagem/Figurinha/Vídeo */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center cursor-pointer"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X className="w-6 h-6" />
            </button>
            {imageModalType === 'video' ? (
              <video
                src={imageModalSrc}
                controls
                autoPlay
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <img
                src={imageModalSrc}
                alt="Modal"
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}