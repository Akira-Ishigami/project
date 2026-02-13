import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, Message } from '../lib/supabase';
import { MessageSquare, LogOut, MoreVertical, Search, AlertCircle, CheckCheck, FileText, Download, User, Menu, X, Send, Paperclip, Image as ImageIcon, Mic, Play, Pause, Loader2, Tag, ArrowRightLeft, Building2, Pin, Bot } from 'lucide-react';
import Toast from './Toast';
import { EmojiPicker } from './EmojiPicker';
import SystemMessage from './SystemMessage';
import { useRealtimeMessages, useRealtimeContacts } from '../hooks';

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
}

interface Department {
  id: string;
  name: string;
  company_id: string | null;
  is_reception?: boolean | null;
  is_default?: boolean | null;
}

interface Sector {
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

export default function AttendantDashboard() {
  const { attendant, signOut } = useAuth();
  const { settings } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactsDB, setContactsDB] = useState<ContactDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastViewedMessageTime, setLastViewedMessageTime] = useState<{ [key: string]: number }>({});
  const [pendingMessagesCount, setPendingMessagesCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Filtro de departamento
  type FilterMode = 'mine' | 'all';
  const [filterMode, setFilterMode] = useState<FilterMode>('mine');

  // Modais de transferência e tags
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Menu de contexto (clique direito)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; phoneNumber: string } | null>(null);

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
      console.error('❌ Erro ao processar reações:', err);
      return messages;
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!attendant?.api_key) {
      setLoading(false);
      return;
    }

    setError(null);

    const timeout = setTimeout(() => {
      setLoading(false);
      // Silenciosamente timeout, sem mostrar erro no front
    }, 10000);

    try {
      // Usar api_key do attendant para buscar mensagens da empresa
      const messagesQuery = supabase
        .from('messages')
        .select('*')
        .eq('apikey_instancia', attendant.api_key);

      const sentMessagesQuery = supabase
        .from('sent_messages')
        .select('*')
        .eq('apikey_instancia', attendant.api_key);

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
      console.log('📤 Mensagens enviadas:', sentResult.data?.length || 0);

      setMessages(messagesWithReactions);
      setLoading(false);
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      clearTimeout(timeout);
      setError(`Erro inesperado: ${error.message}`);
      setLoading(false);
    }
  }, [attendant]);

  const fetchContacts = async () => {
    if (!attendant?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          company_id,
          phone_number,
          name,
          department_id,
          sector_id,
          tag_id,
          last_message,
          last_message_time,
          created_at,
          updated_at,
          pinned,
          ia_ativada,
          contact_tags(tag_id)
        `)
        .eq('company_id', attendant.company_id)
        .order('last_message_time', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((c: any) => ({
        ...c,
        tag_ids: c.contact_tags?.map((ct: any) => ct.tag_id) || [],
      }));

      setContactsDB(normalized);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
    }
  };

  const fetchDepartments = async () => {
    if (!attendant?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id,name,company_id')
        .or(`company_id.eq.${attendant.company_id},company_id.is.null`)
        .order('name');

      if (error) throw error;

      setDepartments(data || []);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  const fetchSectors = async () => {
    if (!attendant?.company_id) return;
    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('company_id', attendant.company_id)
        .order('name');

      if (error) throw error;

      setSectors(data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const fetchTags = async () => {
    if (!attendant?.company_id) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('company_id', attendant.company_id)
        .order('name');

      if (error) throw error;

      setTags(data || []);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchContacts();
    fetchDepartments();
    fetchSectors();
    fetchTags();
  }, [attendant?.company_id, fetchMessages]);

  // Realtime para mensagens
  useRealtimeMessages({
    apiKey: attendant?.api_key,
    enabled: true,
    onMessagesChange: (message: Message) => {
      // Atualizar apenas a lista de mensagens
      setMessages((prevMessages) => {
        const exists = prevMessages.some((m) => m.id === message.id || m.idmessage === message.idmessage);
        if (exists) return prevMessages;

        const updated = [...prevMessages, message].sort((a, b) => {
          return getMessageTimestamp(a) - getMessageTimestamp(b);
        });

        return processReactions(updated);
      });
    },
  });

  // Realtime para contatos
  useRealtimeContacts({
    companyId: attendant?.company_id,
    enabled: true,
    onContactsChange: (contact: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`👥 Contato ${type}:`, contact);
      setContactsDB((prevContacts) => {
        if (type === 'INSERT') {
          return [...prevContacts, { ...contact, tag_ids: contact.tag_ids || [] }];
        }
        if (type === 'UPDATE') {
          return prevContacts.map((c) =>
            c.id === contact.id ? { ...contact, tag_ids: contact.tag_ids || [] } : c
          );
        }
        if (type === 'DELETE') {
          return prevContacts.filter((c) => c.id !== contact.id);
        }
        return prevContacts;
      });
    },
  });

  // Polling
  useEffect(() => {
    if (!attendant?.api_key) return;

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
  }, [attendant?.api_key, fetchMessages]);

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

      // Adicionar tags e departamento do contato
      contact.tag_ids = dbContact?.tag_ids || [];
      contact.department_id = dbContact?.department_id || null;
      contact.sector_id = dbContact?.sector_id || null;

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

  // Filtrar contatos por departamento do atendente
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Aplicar filtro de departamento
    if (filterMode === 'mine' && attendant?.department_id) {
      filtered = filtered.filter(contact =>
        contact.department_id === attendant.department_id
      );
    }

    // Aplicar filtro de pesquisa
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter((contact) => {
      const displayPhone = getPhoneNumber(contact.phoneNumber);
      return (
        contact.name.toLowerCase().includes(searchLower) ||
        displayPhone.toLowerCase().includes(searchLower) ||
        contact.phoneNumber.toLowerCase().includes(searchLower)
      );
    });

    // Ordenar para que contatos fixados apareçam primeiro
    filtered.sort((a, b) => {
      const aDB = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(a.phoneNumber));
      const bDB = contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(b.phoneNumber));
      const aPinned = aDB?.pinned || false;
      const bPinned = bDB?.pinned || false;

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

    return filtered;
  }, [contacts, filterMode, attendant?.department_id, searchTerm, contactsDB]);

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

  // Verificar se o contato pertence ao departamento do atendente
  const isContactFromMyDepartment = useMemo(() => {
    if (!selectedContactData || !attendant?.department_id) return false;
    return selectedContactData.department_id === attendant.department_id;
  }, [selectedContactData, attendant?.department_id]);

  // Carregar tags do contato quando abrir o modal
  useEffect(() => {
    if (showTagModal && selectedContactData) {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContactData.phoneNumber)
      );
      setSelectedTagIds(contactDB?.tag_ids || []);
    }
  }, [showTagModal]);

  // Função para assumir a conversa (transferir para o departamento do atendente)
  const handleAssumeConversation = async () => {
    if (!selectedContactData || !attendant?.department_id) return;

    try {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContactData.phoneNumber)
      );

      if (!contactDB) {
        setToastMessage('Contato não encontrado');
        setShowToast(true);
        return;
      }

      const oldDepartmentId = contactDB.department_id;

      const { error } = await supabase
        .from('contacts')
        .update({
          department_id: attendant.department_id,
          sector_id: attendant.sector_id || null
        })
        .eq('id', contactDB.id);

      if (error) throw error;

      // Registrar a transferência na tabela transferencias
      await supabase
        .from('transferencias')
        .insert({
          company_id: attendant?.company_id,
          api_key: attendant?.api_key,
          contact_id: contactDB.id,
          from_department_id: oldDepartmentId,
          to_department_id: attendant.department_id
        });

      // A mensagem de sistema é criada automaticamente pela trigger do banco

      setToastMessage('Conversa assumida com sucesso!');
      setShowToast(true);

      // Atualizar o estado local
      setContactsDB(prev => prev.map(c =>
        c.id === contactDB.id
          ? { ...c, department_id: attendant.department_id, sector_id: attendant.sector_id || null }
          : c
      ));
    } catch (error: any) {
      console.error('Erro ao assumir conversa:', error);
      setToastMessage('Erro ao assumir conversa');
      setShowToast(true);
    }
  };

  // Nota: A mensagem de sistema de transferência é criada automaticamente pela trigger do banco

  // Função para transferir departamento
  const handleTransferDepartment = async () => {
    if (!selectedContactData || !selectedDepartmentId) return;

    try {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContactData.phoneNumber)
      );

      if (!contactDB) {
        setToastMessage('Contato não encontrado');
        setShowToast(true);
        return;
      }

      const oldDepartmentId = contactDB.department_id;

      const { error } = await supabase
        .from('contacts')
        .update({
          department_id: selectedDepartmentId,
          sector_id: selectedSectorId || null
        })
        .eq('id', contactDB.id);

      if (error) throw error;

      // Registrar a transferência na tabela transferencias
      await supabase
        .from('transferencias')
        .insert({
          company_id: attendant?.company_id,
          api_key: attendant?.api_key,
          contact_id: contactDB.id,
          from_department_id: oldDepartmentId,
          to_department_id: selectedDepartmentId
        });

      // A mensagem de sistema é criada automaticamente pela trigger do banco

      setToastMessage('Departamento transferido com sucesso!');
      setShowToast(true);
      setShowTransferModal(false);

      // Atualizar o estado local
      setContactsDB(prev => prev.map(c =>
        c.id === contactDB.id
          ? { ...c, department_id: selectedDepartmentId, sector_id: selectedSectorId || null }
          : c
      ));

      // Limpar seleção
      setSelectedDepartmentId('');
      setSelectedSectorId('');
    } catch (error: any) {
      console.error('Erro ao transferir departamento:', error);
      setToastMessage('Erro ao transferir departamento');
      setShowToast(true);
    }
  };

  // Função para adicionar/remover tags
  const handleUpdateTags = async () => {
    if (!selectedContactData) return;

    try {
      const contactDB = contactsDB.find(c =>
        normalizeDbPhone(c.phone_number) === normalizeDbPhone(selectedContactData.phoneNumber)
      );

      if (!contactDB) {
        setToastMessage('Contato não encontrado');
        setShowToast(true);
        return;
      }

      // Usar RPC para atualizar tags
      const { data, error } = await supabase.rpc('update_contact_tags', {
        p_contact_id: contactDB.id,
        p_tag_ids: selectedTagIds
      });

      if (error) throw error;

      // Verificar se o RPC retornou sucesso
      if (data && !data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      setToastMessage('Tags atualizadas com sucesso!');
      setShowToast(true);
      setShowTagModal(false);

      // Atualizar o estado local
      setContactsDB(prev => prev.map(c =>
        c.id === contactDB.id
          ? { ...c, tag_ids: selectedTagIds }
          : c
      ));

      // Recarregar contatos para garantir sincronização
      await fetchContacts();
    } catch (error: any) {
      console.error('Erro ao atualizar tags:', error);
      setToastMessage(`Erro ao atualizar tags: ${error.message || 'Erro desconhecido'}`);
      setShowToast(true);
    }
  };

  // Funções do menu de contexto
  const handleContextMenu = (e: React.MouseEvent, phoneNumber: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, phoneNumber });
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
    const contactDB = contactsDB.find(c =>
      normalizeDbPhone(c.phone_number) === normalizeDbPhone(phoneNumber)
    );
    if (contactDB) {
      setSelectedTagIds(contactDB.tag_ids || []);
      setShowTagModal(true);
    }
    closeContextMenu();
  };

  const handleContextMenuTransfer = (phoneNumber: string) => {
    setSelectedContact(phoneNumber);
    setShowTransferModal(true);
    closeContextMenu();
  };

  useEffect(() => {
    if (!selectedContact && filteredContacts.length > 0) {
      setSelectedContact(filteredContacts[0].phoneNumber);
    }
  }, [filteredContacts.length, selectedContact]);

  // Verificar se o contato selecionado ainda está no filtro atual
  useEffect(() => {
    if (selectedContact) {
      const isContactInFilter = filteredContacts.some(c => c.phoneNumber === selectedContact);
      if (!isContactInFilter) {
        // Se o contato selecionado não está mais no filtro
        if (filteredContacts.length > 0) {
          // Selecionar o primeiro contato disponível
          setSelectedContact(filteredContacts[0].phoneNumber);
        } else {
          // Limpar a seleção se não houver contatos
          setSelectedContact('');
        }
      }
    }
  }, [filterMode, filteredContacts, selectedContact]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

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
    if (!attendant || !selectedContact) return;

    setSending(true);
    try {
      const generatedIdMessage = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: existingMessages } = await supabase
        .from('messages')
        .select('instancia, department_id, sector_id, tag_id')
        .eq('numero', selectedContact)
        .eq('apikey_instancia', attendant.api_key)
        .order('date_time', { ascending: false })
        .limit(1);

      const instanciaValue = existingMessages?.[0]?.instancia || attendant.name;
      const departmentId = existingMessages?.[0]?.department_id || null;
      const sectorId = existingMessages?.[0]?.sector_id || null;
      const tagId = existingMessages?.[0]?.tag_id || null;

      const attendantName = attendant?.name || 'Atendente';
      const rawMessage = messageData.message || '';
      const rawCaption = messageData.caption || null;

      const newMessage = {
        numero: selectedContact,
        sender: null,
        'minha?': 'true',
        pushname: attendantName,
        apikey_instancia: attendant.api_key,
        date_time: new Date().toISOString(),
        instancia: instanciaValue,
        idmessage: generatedIdMessage,
        company_id: attendant.company_id,
        department_id: departmentId,
        sector_id: sectorId,
        tag_id: tagId,
        ...messageData,
        message: rawMessage,
        caption: rawCaption,
      };

      const { error: insertError } = await supabase.from('sent_messages').insert([newMessage]);

      if (insertError) {
        console.error('Erro ao inserir mensagem:', insertError);
        throw insertError;
      }

      // Adicionar à lista local imediatamente
      setMessages((prev) => [...prev, newMessage as Message]);

      // Limpar campos de envio
      setMessageText('');
      setImageCaption('');
      setSelectedFile(null);
      setFilePreview(null);

      // Scroll para o fim
      setTimeout(() => scrollToBottom(true), 100);

      setToastMessage('Mensagem enviada com sucesso!');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setToastMessage('Erro ao enviar mensagem');
      setShowToast(true);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Content = base64.split(',')[1];

        const isImage = selectedFile.type.startsWith('image/');
        const isPDF = selectedFile.type === 'application/pdf';

        await sendMessage({
          message: imageCaption || '',
          caption: imageCaption || null,
          tipomessage: isImage ? 'imageMessage' : (isPDF ? 'documentMessage' : 'documentMessage'),
          urlimagem: isImage ? base64Content : null,
          urlpdf: isPDF ? base64Content : null,
          urldocumento: !isImage && !isPDF ? base64Content : null,
        });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      await sendMessage({
        message: messageText,
        tipomessage: 'conversation',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile(file);
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile(file);
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/80">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200 overflow-hidden ${
                settings.logoUrl && settings.logoUrl.trim() !== ''
                  ? 'bg-white border border-slate-200'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
              }`}>
                {settings.logoUrl && settings.logoUrl.trim() !== '' ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <MessageSquare className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {settings.displayName && settings.displayName.trim() !== '' ? settings.displayName : 'ChatFlow'}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {attendant?.name || 'Atendente'}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="ml-2 p-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Contacts List */}
        <div
          className={`${sidebarOpen ? 'flex' : 'hidden'
            } md:flex w-full md:w-[360px] bg-white/95 backdrop-blur-sm border-r border-slate-200/80 flex-col shadow-xl`}
        >
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center gap-3 animate-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Filtros de Departamento */}
          <div className="px-4 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMode('mine')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  filterMode === 'mine'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-[1.02] border border-slate-200'
                }`}
              >
                Meu Departamento
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  filterMode === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-[1.02] border border-slate-200'
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="px-4 py-3 border-b border-slate-200/80">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Pesquisar contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-md transition-all duration-200 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Lista de Contatos */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 px-4 text-center">
                <User className="w-16 h-16 mb-4 text-slate-300" />
                <p className="font-medium text-slate-600">Nenhum contato encontrado</p>
                <p className="text-sm text-slate-400 mt-2">
                  {filterMode === 'mine'
                    ? 'Não há contatos no seu departamento'
                    : 'Nenhuma conversa disponível'}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.phoneNumber}
                  onClick={() => {
                    setSelectedContact(contact.phoneNumber);
                    setSidebarOpen(false);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, contact.phoneNumber)}
                  className={`px-4 py-3.5 border-b border-slate-100 cursor-pointer transition-all duration-200 ${selectedContact === contact.phoneNumber
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-l-4 border-l-blue-600 shadow-sm'
                    : 'hover:bg-slate-50 hover:shadow-sm hover:translate-x-0.5'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0 shadow-md shadow-blue-500/30 transform hover:scale-110 transition-transform duration-200">
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
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedContactData ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
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
                      {/* Badge de departamento se não for do meu departamento */}
                      {selectedContactData.department_id && selectedContactData.department_id !== attendant?.department_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">
                          <Building2 className="w-3 h-3" />
                          Outro departamento
                        </span>
                      )}
                      {/* Tags do contato no cabeçalho */}
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

                {/* Botões de Ação */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm"
                    title="Transferir departamento"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Transferir
                  </button>
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm"
                    title="Adicionar tag"
                  >
                    <Tag className="w-4 h-4" />
                    Tags
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-3"
              >
                {selectedContactData.messages.map((msg, index) => {
                  const isSent = msg['minha?'] === 'true';
                  const isSystemTransfer = msg.message_type === 'system_transfer';
                  const showDate = index === 0 || formatDate(msg.date_time || msg.created_at || '') !== formatDate(selectedContactData.messages[index - 1]?.date_time || selectedContactData.messages[index - 1]?.created_at || '');

                  // Detectar tipo de mídia (mesma lógica do CompanyDashboard)
                  const base64Type = msg.base64 ? detectBase64Type(msg.base64) : null;
                  const tipoFromField = getMessageTypeFromTipomessage(msg.tipomessage);
                  const hasBase64Content = msg.base64 && base64Type;

                  return (
                    <div key={msg.id || msg.idmessage || index}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-white text-slate-600 text-xs px-3 py-1.5 rounded-full shadow-sm font-medium border border-slate-200">
                            {formatDate(msg.date_time || msg.created_at || '')}
                          </span>
                        </div>
                      )}

                      {/* Mensagem de Sistema (Transferência) */}
                      {isSystemTransfer ? (
                        <SystemMessage message={msg} />
                      ) : (
                        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] rounded-[16px] shadow-sm ${isSent ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          style={{
                            backgroundColor: isSent
                              ? 'var(--color-outgoing-bg, #3b82f6)'
                              : 'var(--color-incoming-bg, #f1f5f9)',
                            color: isSent
                              ? 'var(--color-outgoing-text, #ffffff)'
                              : 'var(--color-incoming-text, #1e293b)'
                          }}
                        >
                          {/* Nome do remetente */}
                          <div className="px-3 pt-2 pb-1">
                            <span
                              className="text-xs font-semibold"
                              style={{
                                color: isSent
                                  ? 'var(--color-outgoing-text, #ffffff)'
                                  : 'var(--color-incoming-text, #1e293b)'
                              }}
                            >
                              {isSent ? (attendant?.name || 'Atendente') : (selectedContactData.name || selectedContactData.phoneNumber)}
                            </span>
                          </div>

                          {/* Imagem via urlimagem */}
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

                          {/* Imagem via base64 */}
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
                                  {msg.caption}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sticker via base64 */}
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

                          {/* Vídeo via base64 */}
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

                          {/* Áudio via base64 */}
                          {hasBase64Content && (base64Type === 'audio' || tipoFromField === 'audio') &&
                            base64Type !== 'image' && tipoFromField !== 'image' && (
                              <div className="p-3">
                                <div
                                  className="flex items-center gap-3 p-3 rounded-xl"
                                  style={{
                                    backgroundColor: isSent
                                      ? 'var(--color-outgoing-bg, #3b82f6)'
                                      : 'var(--color-incoming-bg, #f1f5f9)'
                                  }}
                                >
                                  <button
                                    onClick={() => handleAudioPlay(msg.id || msg.idmessage || '', msg.base64!)}
                                    className={`p-2 rounded-full ${isSent ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'} transition`}
                                  >
                                    {playingAudio === (msg.id || msg.idmessage) ? (
                                      <Pause className="w-5 h-5 text-white" />
                                    ) : (
                                      <Play className="w-5 h-5 text-white" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {msg.message || 'Áudio'}
                                    </p>
                                    <p className={`text-[11px] ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
                                      Clique para {playingAudio === (msg.id || msg.idmessage) ? 'pausar' : 'reproduzir'}
                                    </p>
                                  </div>
                                  <Mic className={`w-5 h-5 ${isSent ? 'text-blue-100' : 'text-blue-500'}`} />
                                </div>
                              </div>
                            )}

                          {/* Documento via base64 */}
                          {hasBase64Content && (base64Type === 'document' || tipoFromField === 'document') &&
                            base64Type !== 'audio' && tipoFromField !== 'audio' &&
                            base64Type !== 'image' && tipoFromField !== 'image' &&
                            base64Type !== 'sticker' && tipoFromField !== 'sticker' &&
                            base64Type !== 'video' && tipoFromField !== 'video' && (
                              <div className="p-2">
                                <button
                                  onClick={() => downloadBase64File(msg.base64!, msg.message || 'documento.pdf')}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl w-full ${isSent ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 hover:bg-gray-100'} transition`}
                                >
                                  <FileText className="w-8 h-8 flex-shrink-0" />
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium truncate">
                                      {msg.message || 'Documento'}
                                    </p>
                                    <p className={`text-[11px] ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
                                      Clique para baixar
                                    </p>
                                  </div>
                                  <Download className="w-5 h-5 flex-shrink-0" />
                                </button>
                              </div>
                            )}

                          {/* Documento via urlpdf */}
                          {msg.urlpdf && !hasBase64Content && (
                            <div className="p-2">
                              <a
                                href={msg.urlpdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2.5 rounded-xl ${isSent ? 'bg-blue-600' : 'bg-gray-50'} hover:opacity-90 transition`}
                              >
                                <FileText className="w-8 h-8 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {msg.message || 'Documento'}
                                  </p>
                                  <p className={`text-[11px] ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
                                    Clique para abrir
                                  </p>
                                </div>
                              </a>
                            </div>
                          )}

                          {/* Texto da mensagem */}
                          {msg.message && !msg.urlpdf && !hasBase64Content && (
                            <div className="px-3.5 py-2">
                              <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                            </div>
                          )}

                          {/* Footer com hora e check */}
                          <div className="px-3.5 pb-1.5 flex items-center justify-end gap-1">
                            <span className={`text-[10px] ${isSent ? 'text-blue-100' : 'text-[#64748B]'}`}>
                              {formatTime(msg.date_time || msg.created_at || '')}
                            </span>
                            {isSent && (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-50" />
                            )}
                          </div>

                          {/* Reações */}
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
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-24 right-8 bg-white text-blue-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}

              {/* File Preview */}
              {filePreview && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-t border-slate-200/80 p-4 animate-in slide-in-from-bottom duration-200">
                  <div className="max-w-[200px] relative">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setImageCaption('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {selectedFile?.type.startsWith('image/') ? (
                      <img src={filePreview} alt="Preview" className="max-w-full h-auto rounded-lg shadow-md" />
                    ) : (
                      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-md">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <span className="text-sm text-slate-700 truncate">{selectedFile?.name}</span>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Adicionar legenda..."
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              {/* Message Input ou Botão Assumir Conversa */}
              <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200/80 p-4 shadow-lg">
                {filterMode === 'all' && !isContactFromMyDepartment ? (
                  // Mostrar botão para assumir conversa
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">
                        Este contato pertence a outro departamento
                      </p>
                      <p className="text-xs text-slate-500">
                        Assuma a conversa para poder enviar mensagens
                      </p>
                    </div>
                    <button
                      onClick={handleAssumeConversation}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 shadow-md flex items-center gap-2"
                    >
                      <User className="w-5 h-5" />
                      Assumir Conversa
                    </button>
                  </div>
                ) : (
                  // Input normal de mensagem
                  <div className="flex items-end gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageSelect}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Anexar arquivo"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Enviar imagem"
                    >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef as any}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onPaste={handlePasteContent}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite uma mensagem..."
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-md resize-none min-h-[48px] max-h-[120px] transition-all duration-200"
                      rows={1}
                    />
                    <div className="absolute right-2 bottom-2">
                      <EmojiPicker
                        onEmojiSelect={(emoji) => {
                          setMessageText((prev) => prev + emoji);
                        }}
                      />
                    </div>
                  </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || uploadingFile || (!messageText.trim() && !selectedFile)}
                      className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-md"
                    >
                      {sending || uploadingFile ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center text-slate-500">
                <MessageSquare className="w-24 h-24 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-600">Selecione um contato para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          {imageModalType === 'video' ? (
            <video
              src={imageModalSrc}
              controls
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={imageModalSrc}
              alt="Visualização"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Modal de Transferir Departamento */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                Transferir Departamento
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Departamento
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedSectorId('');
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

              {selectedDepartmentId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Setor (opcional)
                  </label>
                  <select
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value="">Nenhum setor</option>
                    {sectors
                      .filter((sector: any) => sector.department_id === selectedDepartmentId)
                      .map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferDepartment}
                disabled={!selectedDepartmentId}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
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

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Nenhuma tag disponível
                </p>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedTagIds.length >= 5) {
                            setToastMessage('Máximo de 5 tags por contato');
                            setShowToast(true);
                            return;
                          }
                          setSelectedTagIds([...selectedTagIds, tag.id]);
                        } else {
                          setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 font-medium text-slate-900">{tag.name}</span>
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
          className="fixed bg-white rounded-lg shadow-2xl border border-slate-200 py-2 z-50 min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleTogglePin(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700"
          >
            <Pin className="w-4 h-4" />
            {contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contextMenu.phoneNumber))?.pinned
              ? 'Desafixar contato'
              : 'Fixar contato'}
          </button>
          <button
            onClick={() => handleToggleIA(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700"
          >
            <Bot className="w-4 h-4" />
            {contactsDB.find(c => normalizeDbPhone(c.phone_number) === normalizeDbPhone(contextMenu.phoneNumber))?.ia_ativada
              ? 'Desativar IA'
              : 'Ativar IA'}
          </button>
          <button
            onClick={() => handleContextMenuTag(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700"
          >
            <Tag className="w-4 h-4" />
            Adicionar tag
          </button>
          <button
            onClick={() => handleContextMenuTransfer(contextMenu.phoneNumber)}
            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700"
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
