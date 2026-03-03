import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, Message } from '../lib/supabase';
import { MessageSquare, LogOut, Search, AlertCircle, CheckCheck, FileText, Download, User, Menu, X, Send, Paperclip, Image as ImageIcon, Mic, Play, Pause, Loader2, Briefcase, FolderTree, UserCircle2, Tag, Bell, XCircle, Info, ArrowRightLeft, Settings, Pin, Bot, CheckCircle2, FolderOpen, CreditCard } from 'lucide-react';
import DepartmentsManagement from './DepartmentsManagement';
import SectorsManagement from './SectorsManagement';
import AttendantsManagement from './AttendantsManagement';
import TagsManagement from './TagsManagement';
import TicketHistory from './TicketHistory';
import SettingsPage from './SettingsPage';
import MyPlan from './MyPlan';
import ProfileDropdown from './ProfileDropdown';
import Toast from './Toast';
import { EmojiPicker } from './EmojiPicker';
import { linkifyText } from '../lib/linkifyText';
import { useRealtimeMessages, useRealtimeContacts, useAiEnabled } from '../hooks';
import SystemMessage from './SystemMessage';

interface Contact {
  phoneNumber: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  department_id?: string;
  sector_id?: string;
  tag_ids?: string[];
  contact_db_id?: string;
}

interface ContactDB {
  id: string;
  company_id: string;
  phone_number: string;
  name: string;
  department_id: string | null;
  sector_id: string | null;
  tag_id: string | null;
  last_message: string | null;
  last_message_time: string | null;
  created_at: string;
  updated_at: string;
  tag_ids?: string[];
  pinned?: boolean;
  ia_ativada?: boolean;
  ticket_status?: string;
  ticket_closed_at?: string | null;
  ticket_closed_by?: string | null;
}

interface Department {
  id: string;
  name: string;
  company_id: string | null; // ✅ global quando NULL
  is_reception?: boolean | null;
  is_default?: boolean | null;
}

interface Sector {
  id: string;
  name: string;
}

interface NotificationItem {
  id: string;
  company_id: string;
  title: string;
  message: string;
  type: 'payment' | 'info' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

function normalizePhone(input?: string | null): string {
  if (!input) return '';
  const noJid = input.includes('@') ? input.split('@')[0] : input;
  let digits = noJid.replace(/\D/g, '');

  // Remover 9 duplicado após o DDD
  // Formato esperado: 55 (DDI) + 2 dígitos (DDD) + 9 dígitos
  // Se vier: 5569999145425 (13 dígitos com 9 duplicado)
  // Deve virar: 556999145425 (12 dígitos corretos)
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    const resto = digits.substring(4);
    // Se após DDD começar com 99, remover o primeiro 9
    if (resto.startsWith('99')) {
      digits = '55' + ddd + resto.substring(1);
    }
  }

  return digits;
}

// Para consultas no banco (se o número vier sem DDI 55 ou com sufixo @...)
function normalizeDbPhone(input?: string | null): string {
  const digits = normalizePhone(input);
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}


type TabType = 'mensagens' | 'departamentos' | 'setores' | 'atendentes' | 'tags' | 'historico' | 'meu-plano' | 'configuracoes';

export default function CompanyDashboard() {
  const { company, signOut } = useAuth();
  const { settings, loadCompanyTheme } = useTheme();
  const aiEnabled = useAiEnabled(company?.id || null);
  const [activeTab, setActiveTab] = useState<TabType>('mensagens');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactsDB, setContactsDB] = useState<ContactDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState<'todos' | 'departamento' | 'abertos'>('todos');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);

  // Cache para evitar múltiplas buscas no fallback de contatos
  const fetchedPhonesRef = useRef<Set<string>>(new Set());

  const fetchAndCacheContactByPhone = useCallback(async (phone: string) => {
    const phoneNormalized = normalizeDbPhone(phone);
    if (!phoneNormalized) return;
    if (fetchedPhonesRef.current.has(phoneNormalized)) return;
    fetchedPhonesRef.current.add(phoneNormalized);

    try {
      const { data, error: fetchErr } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone_number', phoneNormalized)
        .maybeSingle();

      if (fetchErr) {
        console.error('Erro ao buscar contato (fallback):', fetchErr);
        return;
      }

      if (data) {
        console.log('Fallback contact found:', data.phone_number, data.name, data.company_id);
        setContactsDB(prev => {
          if (prev.some(c => c.id === data.id)) return prev;
          return [...prev, { ...data, tag_ids: data.tag_ids || [] } as any];
        });
      }
    } catch (e) {
      console.error('Erro inesperado ao buscar contato (fallback):', e);
    }
  }, []);


  // Mensagem de sistema no meio do chat (UI)
  const addInlineSystemMessage = useCallback((messageText: string, type: "system_transfer" | "system_notification" = "system_notification") => {
    const nowIso = new Date().toISOString();
    const uiMsg: any = {
      id: `ui_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      numero: selectedContact || null,
      sender: null,
      minha: "false",
      pushname: "SISTEMA",
      tipomessage: type,
      message_type: type,
      message: messageText,
      date_time: nowIso,
      created_at: nowIso,
      apikey_instancia: company?.api_key,
      company_id: company?.id,
    };

    const toTs = (m: any) => {
      const raw = m?.date_time || m?.created_at || m?.timestamp;
      const t = raw ? new Date(raw).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };

    setMessages((prev) => [...prev, uiMsg].sort((a, b) => toTs(a) - toTs(b)));
  }, [selectedContact, company?.api_key, company?.id]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingFile] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [imageModalType, setImageModalType] = useState<'image' | 'sticker' | 'video'>('image');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; phoneNumber: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // ✅ ID do departamento "Recepção" (criado automaticamente no banco)
  const receptionDeptId = useMemo(() => {
    const recepcao = departments.find(
      (d) => d.is_reception === true || String(d.name ?? '').toLowerCase().startsWith('recep')
    );
    return recepcao?.id ?? '';
  }, [departments]);

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [departamentoTransferencia, setDepartamentoTransferencia] = useState<string>('');
  const [setorTransferencia, setSetorTransferencia] = useState<string>('');

  // Mostra apenas setores do departamento selecionado
  const sectorsFiltered = useMemo(() => {
    const deptId = (selectedDepartment || '').trim();
    if (!deptId) return []; // sem dept => não mostra setor
    return sectors.filter((s: any) => s.department_id === deptId);
  }, [sectors, selectedDepartment]);

  // Setores filtrados para transferência
  const sectorsFilteredTransfer = useMemo(() => {
    const deptId = (departamentoTransferencia || '').trim();
    if (!deptId) return [];
    return sectors.filter((s: any) => s.department_id === deptId);
  }, [sectors, departamentoTransferencia]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (company?.id) {
      loadCompanyTheme(company.id);
    }
  }, [company?.id, loadCompanyTheme]);

  // ✅ Ao abrir o modal de transferência, se o contato não tiver departamento, já seleciona a Recepção
  useEffect(() => {
    if (!showTransferModal) return;
    if (selectedDepartment) return;
    if (!receptionDeptId) return;
    setSelectedDepartment(receptionDeptId);
  }, [showTransferModal, selectedDepartment, receptionDeptId]);
  const [, setTransferindo] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [iaGlobalAtivada, setIaGlobalAtivada] = useState(true);
  const [togglingIaGlobal, setTogglingIaGlobal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [lastViewedMessageTime, setLastViewedMessageTime] = useState<{ [key: string]: number }>({});
  const [pendingMessagesCount, setPendingMessagesCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [webhookContacts, setWebhookContacts] = useState<{ name: string; phone: string }[] | null>(null);
  const [loadingWebhookContacts, setLoadingWebhookContacts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handlePasteContent = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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
            console.log('✅ Imagem colada via Ctrl+V anexada para envio');
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
            console.log('✅ Arquivo colado via Ctrl+V convertido para base64');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  const isUserScrollingRef = useRef(false);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    });
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    isUserScrollingRef.current = distanceFromBottom > 100;
    setShowScrollButton(distanceFromBottom > 100);
  };

  const detectBase64Type = (base64: string): 'image' | 'audio' | 'document' | null => {
    if (!base64) return null;

    if (base64.startsWith('data:image/') || base64.startsWith('/9j/') || base64.startsWith('iVBORw0KGgo')) {
      return 'image';
    }

    if (base64.startsWith('data:audio/') || base64.includes('audio/mpeg') || base64.includes('audio/ogg')) {
      return 'audio';
    }

    if (base64.startsWith('data:application/pdf') || base64.startsWith('JVBERi0')) {
      return 'document';
    }

    return 'document';
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

  const getMessageTimestamp = (msg: any): number => {
    if (msg.timestamp && !isNaN(Number(msg.timestamp))) {
      return Number(msg.timestamp) * 1000;
    }
    if (msg.date_time) {
      return new Date(msg.date_time).getTime();
    }
    if (msg.created_at) {
      return new Date(msg.created_at).getTime();
    }
    return 0;
  };

  const processReactions = (messages: any[]) => {
    try {
      const looksLikeEmoji = (v?: string | null) =>
        !!v && v.length <= 6 && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|[\uD800-\uDBFF][\uDC00-\uDFFF]/u.test(v || '');

      return messages.map(msg => {
        if (!msg?.idmessage) return { ...msg, reactions: [] };

        if (msg.reaction_target_id && looksLikeEmoji(msg.reaction_target_id)) {
          console.log(`✨ Mensagem ${msg.idmessage} tem reação: ${msg.reaction_target_id}`);

          return {
            ...msg,
            reactions: [{ emoji: msg.reaction_target_id, count: 1 }]
          };
        }

        return { ...msg, reactions: [] };
      });
    } catch (err) {
      console.error('❌ Erro geral ao processar reações:', err);
      return messages;
    }
  };

  const fetchMessages = useCallback(async (limit?: number) => {
    if (!company) {
      setLoading(false);
      return;
    }

    setError(null);

    const timeout = setTimeout(() => {
      setLoading(false);
      // Silenciosamente timeout, sem mostrar erro no front
    }, 10000);

    try {
      // Incluir fallback por company_id caso mensagens não possuam apikey_instancia
      let messagesQuery = company?.id
        ? supabase.from('messages').select('*').or(`apikey_instancia.eq.${company.api_key},company_id.eq.${company.id}`)
        : supabase.from('messages').select('*').eq('apikey_instancia', company.api_key);

      let sentMessagesQuery = company?.id
        ? supabase.from('sent_messages').select('*').or(`apikey_instancia.eq.${company.api_key},company_id.eq.${company.id}`)
        : supabase.from('sent_messages').select('*').eq('apikey_instancia', company.api_key);

      if (limit) {
        messagesQuery = messagesQuery.order('created_at', { ascending: false }).limit(limit);
        sentMessagesQuery = sentMessagesQuery.order('created_at', { ascending: false }).limit(limit);
      }

      const [receivedResult, sentResult] = await Promise.all([messagesQuery, sentMessagesQuery]);

      clearTimeout(timeout);

      if (receivedResult.error) {
        setError(`Erro ao carregar mensagens recebidas: ${receivedResult.error.message}`);
        return;
      }

      if (sentResult.error) {
        setError(`Erro ao carregar mensagens enviadas: ${sentResult.error.message}`);
        return;
      }

      const allMessages = [
        ...(receivedResult.data || []),
        ...(sentResult.data || [])
      ].sort((a, b) => {
        return getMessageTimestamp(a) - getMessageTimestamp(b);
      });

      // Processar reações
      const messagesWithReactions = processReactions(allMessages);

      console.log('📩 Mensagens recebidas:', receivedResult.data?.length || 0);
      console.log('Dados recebidas:', receivedResult.data);

      // Log para debugar reactionMessage
      const reactionMessages = allMessages.filter(m => m.tipomessage === 'reactionMessage');
      if (reactionMessages.length > 0) {
        console.log('😊 REACTION MESSAGES ENCONTRADAS:', reactionMessages);
        reactionMessages.forEach((rm, idx) => {
          console.log(`  [${idx}] reaction_target_id="${rm.reaction_target_id}", message="${rm.message}", idmessage="${rm.idmessage}", id="${rm.id}"`);
        });
      }

      // Log para mostrar IDs das mensagens normais
      const normalMessages = allMessages.filter(m => m.tipomessage !== 'reactionMessage');
      console.log('📨 MENSAGENS NORMAIS:');
      normalMessages.slice(0, 5).forEach((msg, idx) => {
        console.log(`  [${idx}] idmessage="${msg.idmessage}", message="${msg.message?.substring(0, 30)}", id="${msg.id}"`);
      });

      // Log para verificar captions
      const messagesWithCaption = messagesWithReactions?.filter(m => m.caption);
      if (messagesWithCaption && messagesWithCaption.length > 0) {
        console.log('📝 Mensagens com caption encontradas:', messagesWithCaption);
      }
      console.log('📤 Mensagens enviadas:', sentResult.data?.length || 0);
      console.log('Dados enviadas:', sentResult.data);
      console.log('✉️ Total de mensagens:', messagesWithReactions.length);

      // Log para mensagens de sistema
      const systemMessages = messagesWithReactions.filter(m => m.message_type === 'system_transfer');
      if (systemMessages.length > 0) {
        console.log('🎫 MENSAGENS DE SISTEMA ENCONTRADAS:', systemMessages);
      } else {
        console.log('⚠️ Nenhuma mensagem de sistema encontrada');
      }

      setMessages(messagesWithReactions);

      if (limit && messagesWithReactions.length < limit) {
        setHasMoreMessages(false);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      setError(`Erro ao carregar mensagens: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [company]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loadingMoreMessages || !selectedContact || !company) return;

    setLoadingMoreMessages(true);
    try {
      const currentContactMessages = messages.filter(msg => {
        const contactId = getContactId(msg);
        return normalizeDbPhone(contactId) === normalizeDbPhone(selectedContact);
      }).sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));

      const oldestMessage = currentContactMessages[0];

      if (!oldestMessage) {
        setLoadingMoreMessages(false);
        return;
      }

      const messagesQuery = company?.id
        ? supabase.from('messages')
            .select('*')
            .or(`apikey_instancia.eq.${company.api_key},company_id.eq.${company.id}`)
            .lt('created_at', oldestMessage.created_at)
            .order('created_at', { ascending: false })
            .limit(30)
        : supabase.from('messages')
            .select('*')
            .eq('apikey_instancia', company.api_key)
            .lt('created_at', oldestMessage.created_at)
            .order('created_at', { ascending: false })
            .limit(30);

      const sentMessagesQuery = company?.id
        ? supabase.from('sent_messages')
            .select('*')
            .or(`apikey_instancia.eq.${company.api_key},company_id.eq.${company.id}`)
            .lt('created_at', oldestMessage.created_at)
            .order('created_at', { ascending: false })
            .limit(30)
        : supabase.from('sent_messages')
            .select('*')
            .eq('apikey_instancia', company.api_key)
            .lt('created_at', oldestMessage.created_at)
            .order('created_at', { ascending: false })
            .limit(30);

      const [receivedResult, sentResult] = await Promise.all([messagesQuery, sentMessagesQuery]);

      if (receivedResult.error || sentResult.error) {
        console.error('Erro ao carregar mais mensagens');
        setLoadingMoreMessages(false);
        return;
      }

      const newMessages = [
        ...(receivedResult.data || []),
        ...(sentResult.data || [])
      ].sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));

      const messagesWithReactions = processReactions(newMessages);

      if (messagesWithReactions.length < 30) {
        setHasMoreMessages(false);
      }

      setMessages(prev => {
        const combined = [...messagesWithReactions, ...prev];
        return combined.sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
      });
    } catch (err) {
      console.error('Erro ao carregar mais mensagens:', err);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [hasMoreMessages, loadingMoreMessages, selectedContact, company, messages]);

  const fetchContacts = async () => {
    if (!company?.id) return;

    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id, company_id, phone_number, name, department_id, sector_id, tag_id, last_message, last_message_time, created_at, updated_at, pinned, ia_ativada, ticket_status, ticket_closed_at, ticket_closed_by')
        .eq('company_id', company.id)
        .order('last_message_time', { ascending: false });

      if (contactsError) throw contactsError;

      const { data: contactTagsData, error: contactTagsError } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id');

      if (contactTagsError) {
        console.error('Erro ao carregar contact_tags:', contactTagsError);
      }

      const normalized = (contactsData || []).map((c: any) => {
        const contactTags = (contactTagsData || [])
          .filter((ct: any) => ct.contact_id === c.id)
          .map((ct: any) => ct.tag_id);

        return {
          ...c,
          tag_ids: contactTags,
        };
      });

      setContactsDB(normalized);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
    }
  };


  const fetchDepartments = useCallback(async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id,name,company_id')
        .or(`company_id.eq.${company.id},company_id.is.null`)
        .order('name');

      if (error) throw error;

      setDepartments(data || []);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  }, [company?.id]);


  const fetchSectors = useCallback(async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (error) throw error;
      setSectors(data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  }, [company?.id]);

  const fetchTags = useCallback(async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  }, [company?.id]);

  const fetchNotifications = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadNotificationsCount(unread);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleToggleIaGlobal = async () => {
    if (!company?.id) return;
    try {
      setTogglingIaGlobal(true);
      const newStatus = !iaGlobalAtivada;

      // Update no banco de dados
      const { error } = await supabase
        .from('companies')
        .update({ ia_ativada: newStatus })
        .eq('id', company.id);

      if (error) throw error;

      setIaGlobalAtivada(newStatus);
      setToastMessage(`✅ IA ${newStatus ? 'Ativada' : 'Desativada'} para toda a empresa`);
      setShowToast(true);
    } catch (err) {
      console.error('Erro ao toggle IA global:', err);
      setToastMessage('❌ Erro ao alterar IA');
      setShowToast(true);
      // Revert state on error
      setIaGlobalAtivada(iaGlobalAtivada);
    } finally {
      setTogglingIaGlobal(false);
    }
  };

  const checkPaymentNotifications = async () => {
    try {
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();

      if (sessErr || !session?.access_token) {
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-payment-notifications", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        return;
      }

      console.log('Notificações verificadas:', data);

      // Recarregar notificações após verificação
      await fetchNotifications();
    } catch (error) {
      // Silenciar erros de notificações de pagamento
    }
  };

  const handleUpdateContactInfo = async () => {
  if (!selectedContact || !company?.api_key || !company?.id) return;

  try {
    // Helpers locais (garante que existem)
    const normalizePhone = (v: string) => {
      let digits = (v || "").toString().replace(/\D/g, "").replace(/@.*$/, "");

      // Remover 9 duplicado após o DDD
      if (digits.length === 13 && digits.startsWith('55')) {
        const ddd = digits.substring(2, 4);
        const resto = digits.substring(4);
        if (resto.startsWith('99')) {
          digits = '55' + ddd + resto.substring(1);
        }
      }

      return digits;
    };
    const normalizeDbPhone = (v: string) => {
      const digits = normalizePhone(v);
      if (!digits) return digits;
      return digits.startsWith("55") ? digits : `55${digits}`;
    };

    const selectedPhoneDb = normalizeDbPhone(selectedContact);

    // =========================
    // 1) Pegar contato atual (state -> banco fallback)
    // =========================
    let currentContact: any =
      contactsDB.find((c) => normalizeDbPhone(c.phone_number) === selectedPhoneDb) || null;

    // Se não achou no state OU achou sem id, busca no banco por phone_number
    if (!currentContact?.id) {
      console.warn("⚠️ Contato não encontrado no state, buscando no banco...", selectedPhoneDb);

      // Primeiro busca só por phone_number (evita company.id errado)
      const { data: byPhone, error: byPhoneErr } = await supabase
        .from("contacts")
        .select("id, company_id, phone_number, name, department_id, sector_id")
        .eq("phone_number", selectedPhoneDb)
        .maybeSingle();

      if (byPhoneErr) console.error("❌ Erro ao buscar contato no banco (phone_number):", byPhoneErr);
      if (byPhone?.id) currentContact = byPhone;

      // Se ainda não achou, tenta fallback removendo 55 (caso DB esteja sem 55)
      if (!currentContact?.id) {
        const without55 = selectedPhoneDb.startsWith("55") ? selectedPhoneDb.slice(2) : selectedPhoneDb;
        const { data: byPhone2, error: byPhone2Err } = await supabase
          .from("contacts")
          .select("id, company_id, phone_number, name, department_id, sector_id")
          .eq("phone_number", without55)
          .maybeSingle();

        if (byPhone2Err) console.error("❌ Erro ao buscar contato no banco (phone sem 55):", byPhone2Err);
        if (byPhone2?.id) currentContact = byPhone2;
      }
    }

    if (!currentContact?.id) {
      console.error("❌ Contato não encontrado nem no state nem no banco:", selectedPhoneDb);
      setToastMessage("Contato não encontrado");
      setShowToast(true);
      return;
    }

    const contactId = currentContact.id;

    // =========================
    // 2) Resolver Departamento (ID real)
    // =========================
    const receptionDept =
      departments.find((d) => (d as any).is_reception) ||
      departments.find((d) => d.name?.toLowerCase().startsWith("recep"));

    if (!receptionDept?.id) {
      throw new Error("Departamento Recepção não encontrado (is_reception ou nome começando com 'recep').");
    }

    // selectedDepartment precisa ser ID (uuid). Se vier vazio -> Recepção
    const newDepartmentId =
      selectedDepartment && selectedDepartment.trim() ? selectedDepartment : receptionDept.id;

    // valida se existe na lista carregada
    if (!departments.some((d) => d.id === newDepartmentId)) {
      throw new Error(`Departamento inválido (não está na lista carregada): ${newDepartmentId}`);
    }

    // Setor (não gera mensagem/evento, só atualiza se quiser)
    const newSectorId = selectedSector && selectedSector.trim() ? selectedSector : null;

    // =========================
    // 3) Detectar mudanças
    // =========================
    const oldDepartmentId = currentContact.department_id || receptionDept.id;
    const oldSectorId = currentContact.sector_id || null;

    const departmentChanged = oldDepartmentId !== newDepartmentId;
    const sectorChanged = oldSectorId !== newSectorId;

    // Tags: aqui o state real é selectedTags. Mas o contato no banco não tem tag_ids.
    // A referência correta é a tabela contact_tags. Então consideramos "mudou" sempre que selectedTags for diferente do estado selecionado atual da UI.
    // (Se você já carrega selectedTags a partir do banco ao selecionar o contato, isso fica correto.)

    const currentTagsPre = Array.isArray((currentContact as any).tag_ids) ? (currentContact as any).tag_ids : [];

    const tagsChangedPre =
      selectedTags.length !== currentTagsPre.length ||
      !selectedTags.every((id) => currentTagsPre.includes(id));

    if (!departmentChanged && !sectorChanged && !tagsChangedPre) {
      setToastMessage("Nenhuma alteração foi feita");
      setShowToast(true);
      return;
    }

    // =========================
    // 4) Atualizar CONTACT
    // =========================
    const updates: Record<string, any> = {};
    if (departmentChanged) updates.department_id = newDepartmentId;
    if (sectorChanged) updates.sector_id = newSectorId;

    if (Object.keys(updates).length > 0) {
      const { error: contactError } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", contactId);

      if (contactError) {
        console.error("❌ Erro ao atualizar contato:", contactError);
        throw contactError;
      }
    }

    // =========================
    // 5) Registrar transferência + mensagem UI (somente se mudou dept)
    // =========================
    if (departmentChanged) {
      const oldDeptName = departments.find((d: any) => d.id === oldDepartmentId)?.name || "Desconhecido";
      const newDeptName = departments.find((d: any) => d.id === newDepartmentId)?.name || "Desconhecido";

      console.log("🔄 [TRANSFER] De:", oldDepartmentId, "→ Para:", newDepartmentId);

      // 5.1) Tenta RPC (se existir)
      let transferOk = false;
      try {
        const { error: rpcErr } = await supabase.rpc("transfer_contact_department", {
          p_company_id: company.id,
          p_contact_id: contactId,
          p_to_department_id: newDepartmentId,
        });

        if (rpcErr) {
          console.warn("⚠️ RPC transfer_contact_department falhou, vai para fallback:", rpcErr);
        } else {
          transferOk = true;
        }
      } catch (e) {
        console.warn("⚠️ Exceção ao chamar RPC transfer_contact_department:", e);
      }

      // 5.2) Fallback: INSERT direto em transferencias (se RPC não existir)
      if (!transferOk) {
        const { error: fallbackErr } = await supabase.from("transferencias").insert([
          {
            company_id: company.id,
            api_key: company.api_key,
            contact_id: contactId,
            from_department_id: oldDepartmentId,
            to_department_id: newDepartmentId,
          },
        ]);

        if (fallbackErr) {
          console.error("❌ Fallback insert transferencias falhou:", fallbackErr);
        } else {
          transferOk = true;
        }
      }

      // Mensagem 100% UI
      if (transferOk) {
        addInlineSystemMessage(`Chamado transferido de ${oldDeptName} para ${newDeptName}`, "system_transfer");
      }
    }

    // =========================
    // 6) Atualizar TAGS (somente via RPC)
    // =========================
    // REGRA: nunca acessar contact_tags no frontend.
    // A UI trabalha com selectedTags (string[] de UUIDs).
    // A leitura/exibição vem de contacts.tag_ids (array) e do catálogo `tags`.

    // Detectar se tags mudaram de verdade
    const currentTags = Array.isArray((currentContact as any).tag_ids) ? (currentContact as any).tag_ids : [];
    const tagsChanged =
      selectedTags.length !== currentTags.length ||
      !selectedTags.every((id) => currentTags.includes(id));

    if (tagsChanged) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_contact_tags', {
        p_contact_id: contactId,
        p_tag_ids: selectedTags,
      });

      if (rpcError) {
        console.error('[TAGS][Company] RPC update_contact_tags falhou:', rpcError);
        setToastMessage(`Erro ao atualizar tags: ${rpcError.message || String(rpcError)}`);
        setShowToast(true);
        throw rpcError;
      }

      // Opcional: manter espelho em contacts para UI (tag_ids e tag_id)
      // Isso garante que a lista de contatos e o header/modal atualizem imediatamente.
      const primaryTag = selectedTags.length > 0 ? selectedTags[0] : null;
      const { error: mirrorErr } = await supabase
        .from('contacts')
        .update({ tag_ids: selectedTags, tag_id: primaryTag })
        .eq('id', contactId);

      if (mirrorErr) {
        console.warn('[TAGS][Company] Aviso ao atualizar contacts.tag_ids/tag_id:', mirrorErr);
      }

      // Atualizar estado local imediatamente (sem depender de refetch)
      setContactsDB((prev) =>
        prev.map((c: any) => (c.id === contactId ? { ...c, tag_ids: selectedTags, tag_id: primaryTag } : c))
      );

      // Se quiser garantir consistência total, pode manter o refetch:
      fetchContacts();
    }

    // =========================

    // 7) Sync messages / sent_messages (somente se dept/sector mudou)
    // =========================
    if (Object.keys(updates).length > 0) {
      const phoneForMsg = selectedPhoneDb;

      const [messagesResult, sentMessagesResult] = await Promise.all([
        supabase
          .from("messages")
          .update(updates)
          .eq("apikey_instancia", company.api_key)
          .eq("numero", phoneForMsg),

        supabase
          .from("sent_messages")
          .update(updates)
          .eq("apikey_instancia", company.api_key)
          .eq("numero", phoneForMsg),
      ]);

      if (messagesResult.error) console.error("❌ Erro ao atualizar messages:", messagesResult.error);
      if (sentMessagesResult.error) console.error("❌ Erro ao atualizar sent_messages:", sentMessagesResult.error);
    }

    // =========================
    // 8) Finalização UI
    // =========================
    setToastMessage("Informacoes atualizadas com sucesso!");
    setShowToast(true);

    setSelectedDepartment("");
    setSelectedSector("");
    setSelectedTags([]);

    // Atualiza listas na UI (mantém sua estrutura)
    fetchContacts();
    fetchMessages();
  } catch (error: any) {
    console.error("Erro ao atualizar informações:", error);
    setToastMessage(`Erro: ${error?.message || "Não foi possível atualizar as informações"}`);
    setShowToast(true);
  }
};


  const handleTransferir = async () => {
    if (!selectedContact || !company?.api_key) {
      setToastMessage('❌ Erro: Contato ou empresa não identificados');
      setShowToast(true);
      return;
    }

    // ✅ agora departamentoTransferencia precisa ser UUID
    if (!departamentoTransferencia) {
      setToastMessage('⚠️ Selecione um departamento de destino');
      setShowToast(true);
      return;
    }

    // Pode acontecer de o state estar desatualizado. Fazemos fallback no banco.
    let currentContact: any = contactsDB.find(
      (c) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact)
    );

    if (!currentContact?.id && company?.id) {
      console.warn('⚠️ Contato não encontrado no state, buscando no banco...', selectedContact);
      const { data, error: fetchContactErr } = await supabase
        .from('contacts')
        .select('id, company_id, phone_number, name, department_id')
        .eq('company_id', company.id)
        .eq('phone_number', normalizeDbPhone(selectedContact))
        .maybeSingle();

      if (fetchContactErr) {
        console.error('❌ Erro ao buscar contato no banco:', fetchContactErr);
      }

      if (data) currentContact = data;
    }

    if (!currentContact?.id) {
      setToastMessage('❌ Erro: Contato não encontrado');
      setShowToast(true);
      return;
    }

    const deptDestino = departments.find(d => d.id === departamentoTransferencia);
    if (!deptDestino?.id) {
      setToastMessage('❌ Erro: Departamento destino inválido');
      setShowToast(true);
      return;
    }

    // ✅ evita transferir para o mesmo dept atual
    const oldDeptId = currentContact.department_id || null;
    if (oldDeptId === deptDestino.id) {
      setToastMessage('⚠️ Selecione um departamento diferente do atual');
      setShowToast(true);
      return;
    }

    setTransferindo(true);

    try {
      // 1) Atualizar contact + 2) inserir histórico de transferência
      // Preferência: RPC (1 chamada). Fallback: update+insert.
      let transferOk = false;

      // Tentativa 1: RPC
      try {
        const { error: rpcErr } = await supabase.rpc('transfer_contact_department', {
          p_company_id: company.id,
          p_contact_id: currentContact.id,
          p_to_department_id: deptDestino.id,
        });

        if (rpcErr) {
          console.warn('⚠️ RPC transfer_contact_department falhou, usando fallback...', rpcErr);
        } else {
          transferOk = true;
        }
      } catch (rpcCatch) {
        console.warn('⚠️ Exceção ao chamar RPC, usando fallback...', rpcCatch);
      }

      // Tentativa 2: Fallback (update contacts + insert transferencias)
      if (!transferOk) {
        const updateData: any = { department_id: deptDestino.id };

        // Se um setor foi selecionado, incluir na atualização
        if (setorTransferencia) {
          updateData.sector_id = setorTransferencia;
        } else {
          // Se não selecionou setor, limpar o setor existente
          updateData.sector_id = null;
        }

        const { error: updErr } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', currentContact.id)
          .eq('company_id', company.id);

        if (updErr) throw updErr;

        const { error: insErr } = await supabase.from('transferencias').insert([
          {
            company_id: company.id,
            api_key: company.api_key,
            contact_id: currentContact.id,
            from_department_id: oldDeptId,
            to_department_id: deptDestino.id,
          },
        ]);

        if (insErr) throw insErr;
        transferOk = true;
      }

      if (transferOk) {
        setShowTransferModal(false);
        setDepartamentoTransferencia('');
        setSetorTransferencia('');

        setTimeout(() => {
          setToastMessage(`✅ Contato transferido para ${deptDestino.name}`);
          setShowToast(true);
        }, 100);

        // Mensagem 100% UI (não gravar em messages)
        const oldDeptName = departments.find((d: any) => d.id === oldDeptId)?.name || 'Desconhecido';
        const transferText = `Chamado transferido de ${oldDeptName} para ${deptDestino.name}`;
        addInlineSystemMessage(transferText, 'system_transfer');

        fetchMessages();
        fetchContacts();
      } else {
        setToastMessage(`❌ Erro: Erro desconhecido`);
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('[TRANSFERÊNCIA] Erro:', error);
      setToastMessage(`❌ Erro ao transferir: ${error?.message || 'Erro desconhecido'}`);
      setShowToast(true);
    } finally {
      setTransferindo(false);
    }
  };

  const handleUpdateTags = async () => {
    if (!selectedContact || !company?.id) return;

    try {
      const currentContact = contactsDB.find(
        (c) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact)
      );

      if (!currentContact?.id) {
        setToastMessage('Erro: Contato não encontrado');
        setShowToast(true);
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('update_contact_tags', {
        p_contact_id: currentContact.id,
        p_tag_ids: selectedTags,
      });

      if (rpcError) throw rpcError;

      if (rpcData && !rpcData.success) {
        throw new Error(rpcData.error || 'Erro desconhecido');
      }

      setShowTagModal(false);

      setTimeout(() => {
        setToastMessage('✅ Tags atualizadas com sucesso!');
        setShowToast(true);
      }, 100);

      setContactsDB(prev => prev.map(c =>
        c.id === currentContact.id
          ? { ...c, tag_ids: selectedTags }
          : c
      ));

      fetchContacts();
    } catch (error: any) {
      console.error('Erro ao atualizar tags:', error);
      setToastMessage('Erro ao atualizar tags');
      setShowToast(true);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedContact || !company?.id) return;

    try {
      const currentContact = contactsDB.find(
        (c) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact)
      );

      if (!currentContact?.id) {
        setToastMessage('❌ Erro: Contato não encontrado');
        setShowToast(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          ticket_status: 'finalizado',
          ticket_closed_at: new Date().toISOString(),
          ticket_closed_by: user?.id || null
        })
        .eq('id', currentContact.id)
        .eq('company_id', company.id);

      if (updateError) throw updateError;

      setToastMessage('✅ Atendimento finalizado com sucesso!');
      setShowToast(true);

      setContactsDB(prev => prev.map(c =>
        c.id === currentContact.id
          ? {
              ...c,
              ticket_status: 'finalizado',
              ticket_closed_at: new Date().toISOString(),
              ticket_closed_by: user?.id || null
            }
          : c
      ));

      fetchContacts();
    } catch (error: any) {
      console.error('Erro ao finalizar atendimento:', error);
      setToastMessage('❌ Erro ao finalizar atendimento');
      setShowToast(true);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedContact || !company?.id) return;

    try {
      const currentContact = contactsDB.find(
        (c) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact)
      );

      if (!currentContact?.id) {
        setToastMessage('❌ Erro: Contato não encontrado');
        setShowToast(true);
        return;
      }

      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          ticket_status: 'aberto',
          ticket_closed_at: null,
          ticket_closed_by: null
        })
        .eq('id', currentContact.id)
        .eq('company_id', company.id);

      if (updateError) throw updateError;

      setToastMessage('✅ Chamado reaberto com sucesso!');
      setShowToast(true);

      setContactsDB(prev => prev.map(c =>
        c.id === currentContact.id
          ? {
              ...c,
              ticket_status: 'aberto',
              ticket_closed_at: null,
              ticket_closed_by: null
            }
          : c
      ));

      fetchContacts();
    } catch (error: any) {
      console.error('Erro ao reabrir chamado:', error);
      setToastMessage('❌ Erro ao reabrir chamado');
      setShowToast(true);
    }
  };

  const handleOpenChatFromHistory = (phoneNumber: string) => {
    setActiveTab('mensagens');
    setSelectedContact(phoneNumber);
  };

  useEffect(() => {
    fetchMessages();
    fetchContacts();

    Promise.all([
      fetchDepartments(),
      fetchSectors(),
      fetchTags()
    ]);

    fetchNotifications();
    checkPaymentNotifications();

    if (!company?.api_key) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `apikey_instancia=eq.${company.api_key}`,
        },
        () => {
          fetchMessages();
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sent_messages',
          filter: `apikey_instancia=eq.${company.api_key}`,
        },
        () => {
          fetchMessages();
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.api_key, fetchMessages]);

  // Hook para monitorar mudanças em tempo real nas mensagens
  // Hook para monitorar mudanças em tempo real nas mensagens
  useRealtimeMessages({
    apiKey: company?.api_key,
    enabled: activeTab === 'mensagens',
    onMessagesChange: (message: Message) => {
      // Atualizar apenas a lista de mensagens
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(m => m.id === message.id);
        if (messageExists) {
          return prevMessages.map(m => m.id === message.id ? message : m);
        }
        return [...prevMessages, message].sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
      });
    },
    onNewMessage: (message: Message, type: 'received' | 'sent') => {
      console.log(`📨 Nova mensagem ${type}:`, message);

      // Scroll automático apenas (sem fetchContacts para não alterar nomes)
      if (isUserScrollingRef.current) {
        setPendingMessagesCount(prev => prev + 1);
      } else {
        scrollToBottom();
      }
    }
  });

  // Hook para monitorar mudanças em tempo real nos contatos
  useRealtimeContacts({
    companyId: company?.id,
    enabled: activeTab === 'mensagens',
    onContactsChange: (contact: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`👥 Contato ${type}:`, contact);
      setContactsDB((prevContacts) => {
        const contactExists = prevContacts.some(c => c.id === contact.id);
        if (type === 'DELETE') {
          return prevContacts.filter(c => c.id !== contact.id);
        }
        if (contactExists) {
          return prevContacts.map(c => c.id === contact.id ? { ...c, ...contact } : c);
        }
        return [...prevContacts, contact];
      });
    },
    onContactTagsChange: () => {
      console.log('🏷️ Tags alteradas, recarregando contatos...');
      fetchContacts();
    }
  });
  // Detecta transferências em tempo real e mostra um aviso no meio do chat
  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel(`rt-transferencias-${company.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transferencias", filter: `company_id=eq.${company.id}` },
        (payload: any) => {
          const row = payload?.new || {};
          const contactId = row.contact_id || row.contactId || row.contato_id;
          if (!contactId || !selectedContact) return;

          const currentContact = contactsDB.find(
            (c: any) => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact)
          );
          if (!currentContact?.id || currentContact.id !== contactId) return;

          const fromId = row.from_department_id || row.departamento_origem_id || row.fromDepartmentId;
          const toId = row.to_department_id || row.departamento_destino_id || row.toDepartmentId;

          const fromName = departments.find((d: any) => d.id === fromId)?.name || "Desconhecido";
          const toName = departments.find((d: any) => d.id === toId)?.name || "Desconhecido";

          addInlineSystemMessage(`Chamado transferido de ${fromName} para ${toName}`, "system_transfer");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, selectedContact, contactsDB, departments, addInlineSystemMessage]);



  // Polling automático como fallback - verifica a cada 3 segundos
  useEffect(() => {
    if (activeTab !== 'mensagens' || !company?.api_key) return;

    console.log('⏱️ Iniciando polling de mensagens a cada 3 segundos');

    const pollingInterval = setInterval(() => {
      console.log('🔄 Verificando novas mensagens...');
      fetchMessages();
      fetchContacts();
    }, 3000); // 3 segundos

    return () => {
      clearInterval(pollingInterval);
      console.log('⏹️ Parando polling de mensagens');
    };
  }, [activeTab, company?.api_key, fetchMessages]);

  const fetchWebhookContacts = async () => {
    setLoadingWebhookContacts(true);
    setWebhookContacts(null);
    try {
      const response = await fetch('https://n8n.nexladesenvolvimento.com.br/webhook/buscacontatolucas');
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.contacts || data.data || []);
      setWebhookContacts(list);
    } catch {
      setWebhookContacts([]);
    } finally {
      setLoadingWebhookContacts(false);
    }
  };

  const formatTime = (msgOrTimestamp: any) => {

    if (!msgOrTimestamp) return '';
    try {
      let timestamp: number;

      if (typeof msgOrTimestamp === 'string' || typeof msgOrTimestamp === 'number') {
        timestamp = typeof msgOrTimestamp === 'number' ? msgOrTimestamp : new Date(msgOrTimestamp).getTime();
      } else {
        timestamp = getMessageTimestamp(msgOrTimestamp);
      }

      if (!timestamp || timestamp === 0) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (msgOrTimestamp: any) => {
    if (!msgOrTimestamp) return '';
    try {
      let timestamp: number;

      if (typeof msgOrTimestamp === 'string' || typeof msgOrTimestamp === 'number') {
        timestamp = typeof msgOrTimestamp === 'number' ? msgOrTimestamp : new Date(msgOrTimestamp).getTime();
      } else {
        timestamp = getMessageTimestamp(msgOrTimestamp);
      }

      if (!timestamp || timestamp === 0) return '';

      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getContactId = (msg: Message): string => {
    return normalizePhone(msg.numero || msg.sender || msg.number || '');
  };

  const getPhoneNumber = (contactId: string): string => {
    return normalizePhone(contactId);
  };

  const groupMessagesByContact = (): Contact[] => {
    const contactsMap: { [key: string]: Contact } = {};

    messages.forEach((msg) => {
      const contactId = getContactId(msg);
      if (!contactId) return;

      if (!contactsMap[contactId]) {
        // Buscar informações do contato na tabela contacts
        const contactDB = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contactId));

        // Se não estiver no state, tentar buscar no banco (fallback sem depender de company_id)
        if (!contactDB) {
          fetchAndCacheContactByPhone(contactId);
        }

        // SEMPRE usar nome do banco. Se não existir, exibir vazio (sem fallback)
        const contactName = contactDB?.name || '';

        contactsMap[contactId] = {
          phoneNumber: contactId,
          name: contactName,
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0,
          messages: [],
          department_id: contactDB?.department_id || undefined,
          sector_id: contactDB?.sector_id || undefined,
          tag_ids: contactDB?.tag_ids || [],
          contact_db_id: contactDB?.id || undefined,
        };
      }

      contactsMap[contactId].messages.push(msg);
    });

    const contacts = Object.values(contactsMap).map((contact) => {
      contact.messages.sort((a, b) => {
        return getMessageTimestamp(a) - getMessageTimestamp(b);
      });

      // Filtrar mensagens de sistema e transferência para não aparecer como última mensagem
      const nonSystemMessages = contact.messages.filter(msg =>
        msg.tipomessage !== 'system' &&
        msg.tipomessage !== 'system_transfer' &&
        msg.tipomessage !== 'system_notification' &&
        msg.message_type !== 'system_transfer'
      );
      const lastMsg = nonSystemMessages.length > 0
        ? nonSystemMessages[nonSystemMessages.length - 1]
        : contact.messages[contact.messages.length - 1];

      if (lastMsg) {
        if (lastMsg.message && lastMsg.message.trim()) {
          contact.lastMessage = lastMsg.message;
        } else if (lastMsg.urlimagem || lastMsg.base64?.startsWith('data:image')) {
          contact.lastMessage = 'Imagem';
        } else if (lastMsg.urlaudio || lastMsg.base64?.startsWith('data:audio')) {
          contact.lastMessage = 'Áudio';
        } else if (lastMsg.urlpdf || lastMsg.base64?.startsWith('data:application/pdf')) {
          contact.lastMessage = 'Documento';
        } else if (lastMsg.urlvideo || lastMsg.base64?.startsWith('data:video')) {
          contact.lastMessage = 'Vídeo';
        } else {
          contact.lastMessage = 'Mensagem';
        }
      } else {
        contact.lastMessage = '';
      }

      const lastMsgTime = getMessageTimestamp(lastMsg);
      contact.lastMessageTime = lastMsgTime > 0 ? new Date(lastMsgTime).toISOString() : '';

      // CRÍTICO: O nome SEMPRE vem do banco de dados
      // Se o DB não tiver name, mostramos vazio (sem fallback)
      const dbContact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contact.phoneNumber));
      if (dbContact?.name) {
        contact.name = dbContact.name;
      } else {
        contact.name = '';
      }

      // Contar mensagens pendentes (do cliente, não respondidas pela empresa)
      const lastViewedTime = lastViewedMessageTime[contact.phoneNumber] || 0;
      contact.unreadCount = 0;

      // Procurar por mensagens não lidas do cliente que não foram respondidas
      for (let i = contact.messages.length - 1; i >= 0; i--) {
        const msg = contact.messages[i];
        const isSent = msg['minha?'] === 'true';
        const msgTime = getMessageTimestamp(msg);

        // Se é mensagem do cliente (não enviada pela empresa)
        if (!isSent && msgTime > lastViewedTime) {
          // Verificar se há resposta DEPOIS dessa mensagem
          let hasResponse = false;
          for (let j = i + 1; j < contact.messages.length; j++) {
            const responseMsg = contact.messages[j];
            const isResponseSent = responseMsg['minha?'] === 'true';
            if (isResponseSent) {
              hasResponse = true;
              break;
            }
          }

          // Só contar como pendente se não tem resposta
          if (!hasResponse) {
            contact.unreadCount++;
          }
        }
      }

      return contact;
    });

    contacts.sort((a, b) => {
      // Buscar informações de pinned do banco
      const contactA = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(a.phoneNumber));
      const contactB = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(b.phoneNumber));

      const aPinned = contactA?.pinned || false;
      const bPinned = contactB?.pinned || false;

      // Contatos fixados sempre primeiro
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Se ambos fixados ou ambos não fixados, ordenar por data
      const dateA = new Date(a.lastMessageTime).getTime();
      const dateB = new Date(b.lastMessageTime).getTime();
      return dateB - dateA;
    });

    return contacts;
  };

  const contacts = groupMessagesByContact();

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    const displayPhone = getPhoneNumber(contact.phoneNumber);

    const matchesSearch =
      contact.name.toLowerCase().includes(searchLower) ||
      displayPhone.toLowerCase().includes(searchLower) ||
      contact.phoneNumber.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    const contactDB = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contact.phoneNumber));

    if (contactFilter === 'departamento') {
      if (!receptionDeptId) return true;
      return contactDB?.department_id === receptionDeptId;
    }

    if (contactFilter === 'abertos') {
      return contactDB?.ticket_status === 'aberto' || contactDB?.ticket_status === 'em_processo' || !contactDB?.ticket_status;
    }

    return true;
  });

  const selectedContactData = selectedContact
    ? contacts.find((c) => c.phoneNumber === selectedContact)
    : null;

  const isContactOnline = (() => {
    if (!selectedContactData) return false;
    const lastMsg = selectedContactData.messages?.slice(-1)[0];
    if (!lastMsg || !lastMsg.created_at) return false;
    const lastTs = new Date(lastMsg.created_at).getTime();
    return (Date.now() - lastTs) < 5 * 60 * 1000;
  })();

  useEffect(() => {
    if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0].phoneNumber);
    }
  }, [contacts.length, selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      scrollToBottom(false);
      // Resetar o flag de scroll quando muda de contato
      isUserScrollingRef.current = false;
      // Marcar todas as mensagens como vistas
      if (selectedContactData?.messages) {
        const lastMsgTime = selectedContactData.messages.reduce((max, msg) => {
          return Math.max(max, getMessageTimestamp(msg));
        }, 0);
        setLastViewedMessageTime(prev => ({
          ...prev,
          [selectedContact]: lastMsgTime
        }));
      }
    }
  }, [selectedContact]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Contar mensagens pendentes (novas mensagens que não foram vistas)
  useEffect(() => {
    if (!selectedContact || !selectedContactData?.messages) {
      setPendingMessagesCount(0);
      return;
    }

    const lastViewedTime = lastViewedMessageTime[selectedContact] || 0;
    const pendingCount = selectedContactData.messages.filter(msg => {
      const isSent = msg['minha?'] === 'true';
      const msgTime = getMessageTimestamp(msg);
      return !isSent && msgTime > lastViewedTime;
    }).length;

    setPendingMessagesCount(pendingCount);
  }, [messages, selectedContact, selectedContactData, lastViewedMessageTime]);

  const sendMessage = async (messageData: Partial<Message>) => {
    if (!company || !selectedContact) return;

    setSending(true);
    try {
      const generatedIdMessage = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: existingMessages } = await supabase
        .from('messages')
        .select('instancia, department_id, sector_id, tag_id')
        .eq('numero', selectedContact)
        .eq('apikey_instancia', company.api_key)
        .order('date_time', { ascending: false })
        .limit(1);

      const instanciaValue = existingMessages?.[0]?.instancia || company.name;
      const departmentId = existingMessages?.[0]?.department_id || null;
      const sectorId = existingMessages?.[0]?.sector_id || null;
      const tagId = existingMessages?.[0]?.tag_id || null;

      // ✅ Envio pelo painel da empresa: NÃO prefixar texto.
      // Envie apenas o conteúdo puro e deixe a padronização para o n8n.
      const attendantName = company.name;
      const rawMessage = messageData.message || '';
      const rawCaption = messageData.caption || null;

      const newMessage = {
        numero: selectedContact,
        sender: null,
        'minha?': 'true',
        pushname: attendantName,
        apikey_instancia: company.api_key,
        date_time: new Date().toISOString(),
        instancia: instanciaValue,
        idmessage: generatedIdMessage,
        company_id: company.id,
        department_id: departmentId,
        sector_id: sectorId,
        tag_id: tagId,
        ...messageData,
        // garante que o texto/caption salvos fiquem puros (sem prefixo)
        message: rawMessage,
        caption: rawCaption,
      };

      // salva no sent_messages (porque é "minha? true")
      const { error: insertErr } = await supabase.from('sent_messages').insert([newMessage]);
      if (insertErr) console.error('Erro ao salvar sent_messages:', insertErr);


      try {
        const timestamp = new Date().toISOString();

        // Buscar nomes reais de dept/setor
        const deptName = departments.find(d => d.id === departmentId)?.name || 'Recepção';
        const sectorName = sectors.find(s => s.id === sectorId)?.name || 'Recepção';

        const webhookPayload = {
          numero: selectedContact,
          message: messageData.message || '',
          tipomessage: messageData.tipomessage || 'conversation',
          base64: messageData.base64 || null,
          urlimagem: messageData.urlimagem || null,
          urlpdf: messageData.urlpdf || null,
          caption: messageData.caption || null,
          idmessage: generatedIdMessage,
          pushname: company.name,

          // ✅ Usando valores reais do dept/setor
          department_name: deptName,
          sector_name: sectorName,

          timestamp: new Date().toISOString(),
          instancia: instanciaValue,
          apikey_instancia: company.api_key,
        };


        const webhookResponse = await fetch('https://n8n.nexladesenvolvimento.com.br/webhook/EnvioMensagemOPS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          console.error('Erro ao enviar para webhook:', webhookResponse.status);
        }
      } catch (webhookError) {
        console.error('Erro ao chamar webhook:', webhookError);
      }

      setMessageText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, phoneNumber: string) => {
    e.preventDefault();

    const menuWidth = 200;
    const menuHeight = 180;
    const padding = 10;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }

    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    if (x < padding) {
      x = padding;
    }

    if (y < padding) {
      y = padding;
    }

    setContextMenu({ x, y, phoneNumber });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleTogglePin = async (phoneNumber: string) => {
    try {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(phoneNumber)
      );

      if (!contactDB) {
        setToastMessage('Contato não encontrado');
        setShowToast(true);
        return;
      }

      const newPinnedState = !contactDB.pinned;

      const { error } = await supabase
        .from('contacts')
        .update({ pinned: newPinnedState })
        .eq('id', contactDB.id);

      if (error) throw error;

      setToastMessage(newPinnedState ? 'Contato fixado!' : 'Contato desfixado!');
      setShowToast(true);

      setContactsDB(prev => prev.map(c =>
        c.id === contactDB.id
          ? { ...c, pinned: newPinnedState }
          : c
      ));
    } catch (error: any) {
      console.error('Erro ao fixar/desafixar contato:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      setToastMessage(`Erro ao fixar contato: ${errorMessage}`);
      setShowToast(true);
    }
    closeContextMenu();
  };

  const handleToggleIA = async (phoneNumber: string) => {
    try {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(phoneNumber)
      );

      if (!contactDB) {
        setToastMessage('Contato não encontrado');
        setShowToast(true);
        return;
      }

      const newIAState = !contactDB.ia_ativada;

      const { error } = await supabase
        .from('contacts')
        .update({ ia_ativada: newIAState })
        .eq('id', contactDB.id);

      if (error) throw error;

      setToastMessage(newIAState ? 'IA ativada para este contato!' : 'IA desativada para este contato!');
      setShowToast(true);

      setContactsDB(prev => prev.map(c =>
        c.id === contactDB.id
          ? { ...c, ia_ativada: newIAState }
          : c
      ));
    } catch (error: any) {
      console.error('Erro ao alterar IA do contato:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      setToastMessage(`Erro ao alterar IA: ${errorMessage}`);
      setShowToast(true);
    }
    closeContextMenu();
  };

  const handleContextMenuTag = (phoneNumber: string) => {
    setSelectedContact(phoneNumber);
    closeContextMenu();

    setTimeout(() => {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(phoneNumber)
      );
      if (contactDB) {
        setSelectedTags(contactDB.tag_ids || []);
        setShowTagModal(true);
      } else {
        setToastMessage('Contato não encontrado');
        setShowToast(true);
      }
    }, 50);
  };

  const handleContextMenuTransfer = (phoneNumber: string) => {
    setSelectedContact(phoneNumber);
    setShowTransferModal(true);
    closeContextMenu();
  };

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

  const handleSendMessage = async () => {
    if (sending) return;
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
          base64: base64,
        };

        if (isImage) {
          messageData.message = messageText.trim() || 'Imagem';
          if (imageCaption) {
            messageData.caption = imageCaption;
          }
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
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
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


  if (loading && !error) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Carregando mensagens...</p>
          </div>
        </div>
      </div>
    );
  }

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const date = formatDate(msg);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const currentMessages = selectedContactData?.messages || [];
  const messageGroups = groupMessagesByDate(currentMessages);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 overflow-hidden pt-14">
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          duration={2500}
        />
      )}

      <ProfileDropdown
        userName={settings.companyName || company?.name || 'Empresa'}
        onHistoryClick={() => setActiveTab('historico')}
        onSettingsClick={() => setActiveTab('configuracoes')}
        onLogout={signOut}
        showNavigationOptions={true}
        onMessagesClick={() => setActiveTab('mensagens')}
        onDepartmentsClick={() => setActiveTab('departamentos')}
        onSectorsClick={() => setActiveTab('setores')}
        onAttendantsClick={() => setActiveTab('atendentes')}
        onTagsClick={() => setActiveTab('tags')}
        onMyPlanClick={() => setActiveTab('meu-plano')}
        activeTab={activeTab}
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Contacts List (Apenas para aba mensagens) */}
        {activeTab === 'mensagens' && (
          <div
            className={`${sidebarOpen ? 'flex' : 'hidden'
              } md:flex w-full md:w-[320px] bg-[#F8FAFC] border-r border-gray-200 flex-col`}
          >

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border-b border-red-200/50 px-5 py-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm flex-1">{error}</p>
              </div>
            )}

            {(settings.companyName || settings.logoUrl) && (
              <div className="px-4 py-4 border-b border-slate-200/80 bg-gradient-to-r from-blue-50 to-slate-50">
                <div className="flex items-center gap-3">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.companyName || 'Logo'}
                      className="h-10 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {settings.companyName && (
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {settings.companyName}
                      </h2>
                      <p className="text-xs text-slate-600">
                        Identidade da Empresa
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="px-5 py-4 border-b border-slate-200/80 bg-white/50 backdrop-blur-sm">
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 shadow-sm"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setContactFilter('departamento')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    contactFilter === 'departamento'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Departamento
                </button>
                <button
                  onClick={() => setContactFilter('abertos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    contactFilter === 'abertos'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Chamados Abertos
                </button>
                <button
                  onClick={() => setContactFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    contactFilter === 'todos'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white  ">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-200/50">
                    <MessageSquare className="w-10 h-10 text-blue-500" />
                  </div>
                  <p className="text-slate-500 text-sm text-center font-medium">
                    {searchTerm ? 'Nenhum contato encontrado' : 'Nenhuma conversa ainda'}
                  </p>
                  <p className="text-slate-400 text-xs text-center mt-2">
                    {searchTerm ? 'Tente pesquisar outro termo' : 'Aguardando novas mensagens'}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.phoneNumber}
                      onClick={() => {
                        setSelectedContact(contact.phoneNumber);
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, contact.phoneNumber)}
                      className={`group cursor-pointer p-3.5 rounded-xl transition-all duration-200 ${
                        selectedContact === contact.phoneNumber
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 shadow-md shadow-blue-200/40 border border-blue-200/50'
                          : 'bg-white hover:bg-slate-50 hover:shadow-sm border border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0 shadow-md shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-200">
                          {contact.name ? contact.name[0].toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate text-sm">
                                {contact.name || getPhoneNumber(contact.phoneNumber)}
                              </h3>
                              {contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contact.phoneNumber))?.pinned && (
                                <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" />
                              )}
                            </div>
                            <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                              {formatTime(contact.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-slate-600 truncate flex-1">
                              {contact.lastMessage}
                            </p>
                            {contact.unreadCount > 0 && (
                              <span className="ml-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40 animate-pulse">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão circular + painel de contatos do webhook */}
            <div className="relative px-4 pb-4 pt-2 border-t border-slate-200/80 bg-white">
              {webhookContacts !== null && (
                <div className="mb-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                  {webhookContacts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Nenhum contato encontrado</p>
                  ) : (
                    webhookContacts.map((wc, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white transition-colors border-b border-slate-100 last:border-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {wc.name ? wc.name[0].toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{wc.name || 'Sem nome'}</p>
                          <p className="text-xs text-slate-500 truncate">{wc.phone || ''}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    if (webhookContacts !== null) {
                      setWebhookContacts(null);
                    } else {
                      fetchWebhookContacts();
                    }
                  }}
                  title={webhookContacts !== null ? 'Fechar lista' : 'Buscar contatos'}
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  {loadingWebhookContacts ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : webhookContacts !== null ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 flex-col ${activeTab === 'mensagens' && sidebarOpen ? 'hidden md:flex' : 'flex'} bg-white`}>
          {activeTab === 'mensagens' && selectedContactData ? (
            <>
              <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {selectedContactData.name ? selectedContactData.name[0].toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {selectedContactData.name || getPhoneNumber(selectedContactData.phoneNumber)}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {getPhoneNumber(selectedContactData.phoneNumber)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {selectedContactData.department_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full border border-sky-200">
                          <Briefcase className="w-3 h-3" />
                          {departments.find(d => d.id === selectedContactData.department_id)?.name || 'Departamento'}
                        </span>
                      )}
                      {selectedContactData.sector_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full border border-violet-200">
                          <FolderTree className="w-3 h-3" />
                          {sectors.find(s => s.id === selectedContactData.sector_id)?.name || 'Setor'}
                        </span>
                      )}
                      {selectedContactData.tag_ids && selectedContactData.tag_ids.length > 0 && (
                        <>
                          {selectedContactData.tag_ids.map((tagId) => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <span
                                key={tagId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                <Tag className="w-3 h-3" />
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const currentContact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
                      setSelectedDepartment(currentContact?.department_id || receptionDeptId || '');
                      setSelectedSector(currentContact?.sector_id || '');
                      setDepartamentoTransferencia('');
                      setSetorTransferencia('');
                      setShowTransferModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all duration-200 flex items-center gap-2"
                    title="Transferir departamento"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Transferir
                  </button>
                  <button
                    onClick={() => {
                      const currentContact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
                      setSelectedTags(currentContact?.tag_ids || []);
                      setShowTagModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all duration-200 flex items-center gap-2"
                    title="Gerenciar tags"
                  >
                    <Tag className="w-4 h-4" />
                    Tags
                  </button>
                  {(() => {
                    const currentContact = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContact));
                    const isFinalized = currentContact?.ticket_status === 'finalizado';

                    return isFinalized ? (
                      <button
                        onClick={handleReopenTicket}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm"
                        title="Abrir chamado"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Abrir Chamado</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleCloseTicket}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm"
                        title="Finalizar atendimento"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Finalizar</span>
                      </button>
                    );
                  })()}
                </div>
              </header>

              <div
                className="flex-1 overflow-y-auto px-3 py-4"
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                style={{
                  backgroundColor: settings.backgroundColor
                }}
              >
                <div className="w-full">
                  {hasMoreMessages && currentMessages.length >= 30 && (
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={loadMoreMessages}
                        disabled={loadingMoreMessages}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingMoreMessages ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          'Carregar mensagens antigas'
                        )}
                      </button>
                    </div>
                  )}
                  {Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date} className="mb-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-white  px-3 py-1 rounded-full border border-gray-200 ">
                          <p className="text-xs text-gray-600  font-medium">{date}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {msgs.map((msg) => {
                          // Renderizar mensagens de sistema (transferência de departamento)
                          if (msg.message_type === 'system_transfer' || msg.tipomessage === 'system_transfer') {
                            console.log('📋 Renderizando mensagem de transferência:', msg);
                            return <SystemMessage key={msg.id} message={{ ...msg, message_type: msg.message_type || msg.tipomessage }} />;
                          }

                          // Renderizar notificações de sistema antigas (troca de setor)
                          if (msg.tipomessage === 'system_notification') {
                            return (
                              <div key={msg.id} className="flex justify-center my-4">
                                <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-center">
                                  <p className="text-sm text-blue-700 font-medium">{linkifyText(msg.message)}</p>
                                </div>
                              </div>
                            );
                          }

                          const isSentMessage = msg['minha?'] === 'true';
                          // Para mensagem enviada pela empresa (isSentMessage): manter pushname/empresa
                          // Para mensagem recebida: mostrar APENAS o nome vindo da tabela contacts (ou vazio se não existir)
                          const contactIdForLabel = getContactId(msg);
                          const dbContactForLabel = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contactIdForLabel));
                          if (!dbContactForLabel) fetchAndCacheContactByPhone(contactIdForLabel);
                          const senderLabel = isSentMessage ? (msg.pushname || company?.name || 'Atendente') : (dbContactForLabel?.name || '');
                          const base64Type = msg.base64 ? detectBase64Type(msg.base64) : null;
                          const tipoFromField = getMessageTypeFromTipomessage(msg.tipomessage);
                          const hasBase64Content = msg.base64 && base64Type;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSentMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-[16px] shadow-sm ${isSentMessage ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                                style={{
                                  backgroundColor: isSentMessage
                                    ? 'var(--color-outgoing-bg, #3b82f6)'
                                    : 'var(--color-incoming-bg, #f1f5f9)',
                                  color: isSentMessage
                                    ? 'var(--color-outgoing-text, #ffffff)'
                                    : 'var(--color-incoming-text, #1e293b)'
                                }}
                              >
                                {/* TOPO DO BALÃO: APENAS NOME DO REMETENTE */}
                                <div className="px-3 pt-2 pb-1">
                                  <span
                                    className="text-xs font-semibold"
                                    style={{
                                      color: isSentMessage
                                        ? 'var(--color-outgoing-text, #ffffff)'
                                        : 'var(--color-incoming-text, #1e293b)'
                                    }}
                                  >
                                    {senderLabel}
                                  </span>
                                </div>

                                {msg.urlimagem && !hasBase64Content && (
                                  <div className="p-1">
                                    <img
                                      src={msg.urlimagem}
                                      alt="Imagem"
                                      className="rounded-xl max-w-full h-auto cursor-pointer hover:opacity-95 transition"
                                      style={{ maxHeight: '300px' }}
                                      onClick={() => openImageModal(msg.urlimagem!)}
                                    />
                                  </div>
                                )}

                                {hasBase64Content && (base64Type === 'image' || tipoFromField === 'image') && (base64Type !== 'sticker' && tipoFromField !== 'sticker') && (
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
                                        {linkifyText(msg.caption)}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {hasBase64Content && (base64Type === 'sticker' || tipoFromField === 'sticker') && (
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

                                {hasBase64Content && (base64Type === 'video' || tipoFromField === 'video') && (
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
                                        <Play className="w-6 h-6 text-blue-500 ml-1" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {hasBase64Content && (base64Type === 'audio' || tipoFromField === 'audio') &&
                                  base64Type !== 'image' && tipoFromField !== 'image' && (
                                    <div className="p-3">
                                      <div
                                        className="flex items-center gap-3 p-3 rounded-xl"
                                        style={{
                                          backgroundColor: isSentMessage
                                            ? 'var(--color-outgoing-bg, #3b82f6)'
                                            : 'var(--color-incoming-bg, #f1f5f9)'
                                        }}
                                      >
                                        <button
                                          onClick={() => handleAudioPlay(msg.id, msg.base64!)}
                                          className={`p-2 rounded-full ${isSentMessage ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'
                                            } transition`}
                                        >
                                          {playingAudio === msg.id ? (
                                            <Pause className="w-5 h-5 text-white" />
                                          ) : (
                                            <Play className="w-5 h-5 text-white" />
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
                                        <Mic className={`w-5 h-5 ${isSentMessage ? 'text-blue-100' : 'text-blue-500'}`} />
                                      </div>
                                    </div>
                                  )}

                                {hasBase64Content && (base64Type === 'document' || tipoFromField === 'document') &&
                                  base64Type !== 'audio' && tipoFromField !== 'audio' &&
                                  base64Type !== 'image' && tipoFromField !== 'image' &&
                                  base64Type !== 'sticker' && tipoFromField !== 'sticker' &&
                                  base64Type !== 'video' && tipoFromField !== 'video' && (
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
                                        <Download className="w-5 h-5 flex-shrink-0" />
                                      </button>
                                    </div>
                                  )}

                                {msg.urlpdf && !hasBase64Content && (
                                  <div className="p-2">
                                    <a
                                      href={msg.urlpdf}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2.5 rounded-xl ${isSentMessage ? 'bg-blue-600' : 'bg-gray-50'
                                        } hover:opacity-90 transition`}
                                    >
                                      <FileText className="w-8 h-8 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {msg.message || 'Documento'}
                                        </p>
                                        <p className={`text-[11px] ${isSentMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                          Clique para abrir
                                        </p>
                                      </div>
                                    </a>
                                  </div>
                                )}

                                {msg.message && !msg.urlpdf && !hasBase64Content && (
                                  <div className="px-3.5 py-2">
                                    <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                                      {linkifyText(msg.message)}
                                    </p>
                                  </div>
                                )}

                                <div className="px-3.5 pb-1.5 flex items-center justify-end gap-1">
                                  <span className={`text-[10px] ${isSentMessage ? 'text-blue-100' : 'text-[#64748B]'}`}>
                                    {formatTime(msg)}
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
                    if (selectedContactData?.messages) {
                      const lastMsgTime = selectedContactData.messages.reduce((max, msg) => {
                        return Math.max(max, getMessageTimestamp(msg));
                      }, 0);
                      setLastViewedMessageTime(prev => ({
                        ...prev,
                        [selectedContact!]: lastMsgTime
                      }));
                    }
                  }}
                  className="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all flex items-center justify-center"
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

              <div className="bg-white px-6 py-4 border-t border-gray-200">
                {filePreview && (
                  <div className="mb-3 px-4 py-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 mb-1 font-medium">Imagem selecionada</p>
                        <p className="text-xs text-gray-600">{selectedFile?.name}</p>
                        <button
                          onClick={clearSelectedFile}
                          className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium"
                        >
                          Remover imagem
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFile && selectedFile.type.startsWith('image/') && (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Legenda para imagem (opcional)"
                      className="w-full px-4 py-2.5 text-sm bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400"
                    />
                  </div>
                )}

                {selectedFile && !selectedFile.type.startsWith('image/') && (
                  <div className="mb-3 px-4 py-3 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Arquivo selecionado</p>
                        <p className="text-xs text-gray-600">{selectedFile?.name}</p>
                        <button
                          onClick={clearSelectedFile}
                          className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium"
                        >
                          Remover arquivo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={sending || !!selectedFile}
                    className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
                    title="Enviar imagem"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || !!selectedFile}
                    className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
                    title="Enviar arquivo"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3 border border-gray-200 focus-within:border-[#2563EB] focus-within:bg-white transition-all">
                    <textarea
                      ref={messageInputRef as React.RefObject<HTMLTextAreaElement>}
                      rows={1}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onPaste={handlePasteContent}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        // Shift+Enter -> newline (default behavior)
                      }}
                      placeholder="Digite uma mensagem ou arraste um arquivo…"
                      disabled={sending}
                      className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50 text-sm resize-none"
                    />
                    <EmojiPicker
                      onSelect={(emoji) => setMessageText(prev => prev + emoji)}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={(!messageText.trim() && !selectedFile) || sending}
                    className="p-3 bg-[#2563EB] hover:bg-[#1f4fd3] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Enviar mensagem"
                  >
                    {sending || uploadingFile ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>

                {uploadingFile && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-500 font-medium">Enviando arquivo...</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'mensagens' ? (
            <div className="flex-1 flex items-center justify-center bg-transparent">
              <div className="text-center p-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageSquare className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3 tracking-tight">Selecione uma conversa para começar</h3>
                <p className="text-gray-500 text-sm">Escolha um contato na lista à esquerda</p>
              </div>
            </div>
          ) : activeTab === 'departamentos' ? (
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50    overflow-y-auto">
              <DepartmentsManagement />
            </div>
          ) : activeTab === 'setores' ? (
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50    overflow-y-auto">
              <SectorsManagement />
            </div>
          ) : activeTab === 'atendentes' ? (
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50    overflow-y-auto">
              <AttendantsManagement />
            </div>
          ) : activeTab === 'tags' ? (
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50    overflow-y-auto">
              <TagsManagement />
            </div>
          ) : activeTab === 'historico' ? (
            <TicketHistory onOpenChat={handleOpenChatFromHistory} />
          ) : activeTab === 'meu-plano' ? (
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 overflow-y-auto">
              <MyPlan companyId={company?.id || ''} />
            </div>
          ) : activeTab === 'configuracoes' ? (
            <SettingsPage />
          ) : null}
        </div>
      </div>

      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 cursor-pointer"
          onClick={closeImageModal}
        >
          <div className="relative max-w-5xl max-h-[90vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
              title="Fechar"
            >
              <X className="w-8 h-8" />
            </button>
            {imageModalType === 'video' ? (
              <video
                src={imageModalSrc}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : (
              <img
                src={imageModalSrc}
                alt="Imagem ampliada"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Modal de Transferir Departamento */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative z-[10000]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                Transferir Departamento
              </h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setDepartamentoTransferencia('');
                  setSetorTransferencia('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Departamento de Destino
                </label>
                <select
                  value={departamentoTransferencia}
                  onChange={(e) => {
                    setDepartamentoTransferencia(e.target.value);
                    setSetorTransferencia('');
                  }}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Setor (Opcional)
                </label>
                <select
                  value={setorTransferencia}
                  onChange={(e) => setSetorTransferencia(e.target.value)}
                  disabled={!departamentoTransferencia}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione um setor</option>
                  {sectorsFilteredTransfer.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setDepartamentoTransferencia('');
                  setSetorTransferencia('');
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferir}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
              >
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tags */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-6 h-6 text-blue-600" />
                Gerenciar Tags
              </h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Nenhuma tag disponível
                </p>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedTags.length < 5) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setToastMessage('Você pode selecionar no máximo 5 tags');
                            setShowToast(true);
                          }
                        } else {
                          setSelectedTags(selectedTags.filter(id => id !== tag.id));
                        }
                      }}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      disabled={!selectedTags.includes(tag.id) && selectedTags.length >= 5}
                    />
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white flex-1"
                      style={{ backgroundColor: tag.color }}
                    >
                      <Tag className="w-4 h-4" />
                      {tag.name}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTagModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateTags}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu de contexto (clique direito) */}
      {contextMenu && (
        <div
          className="fixed bg-white  rounded-lg shadow-2xl border border-slate-200  py-2 z-50 min-w-[200px] transition-colors duration-300"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleTogglePin(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50  transition-colors flex items-center gap-3 text-slate-700 "
          >
            <Pin className="w-4 h-4" />
            {contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contextMenu.phoneNumber))?.pinned
              ? 'Desafixar contato'
              : 'Fixar contato'}
          </button>
          {aiEnabled && (
            <button
              onClick={() => handleToggleIA(contextMenu.phoneNumber)}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-50  transition-colors flex items-center gap-3 text-slate-700 "
            >
              <Bot className="w-4 h-4" />
              {contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contextMenu.phoneNumber))?.ia_ativada
                ? 'Desativar IA'
                : 'Ativar IA'}
            </button>
          )}
          <button
            onClick={() => handleContextMenuTag(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50  transition-colors flex items-center gap-3 text-slate-700 "
          >
            <Tag className="w-4 h-4" />
            Adicionar tag
          </button>
          <button
            onClick={() => handleContextMenuTransfer(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50  transition-colors flex items-center gap-3 text-slate-700 "
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferir departamento
          </button>
        </div>
      )}

      {/* Toast de notificação */}
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  );
}
