import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
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
import SystemMessage from './SystemMessage';
import { EmojiPicker } from './EmojiPicker';
import { useRealtimeMessages, useRealtimeContacts } from '../hooks';

interface Message {
  id?: number;
  numero: string | null;
  sender?: string | null;
  pushname: string | null;
  tipomessage: string | null;
  message: string | null;
  timestamp: string | null;
  created_at: string;
  apikey_instancia?: string;
  sector_id?: string | null;
  department_id?: string | null;
  tag_id?: string | null;
  date_time?: string | null;
  instancia?: string | null;
  idmessage?: string | null;
  mimetype?: string | null;
  base64?: string | null;
  urlpdf?: string | null;
  urlimagem?: string | null;
  caption?: string | null;
  company_id?: string | null;
  'minha?'?: string | null;
}

interface Contact {
  phoneNumber: string; // normalizado (somente dígitos)
  name: string;
  lastMessage: string;
  lastMessageTime: string; // ISO
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

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [modalContactPhone, setModalContactPhone] = useState<string | null>(null); // phone normalizado
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
  const [base64Data, setBase64Data] = useState<string | null>(null);
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
            const base64Data = base64.split(',')[1];
            setBase64Data(base64Data);
            console.log('✅ Imagem colada via Ctrl+V convertida para base64');
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
            const base64Data = base64.split(',')[1];
            setBase64Data(base64Data);
            console.log('✅ Arquivo colado via Ctrl+V convertido para base64');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const getMessageTypeFromTipomessage = (tipomessage?: string): 'image' | 'audio' | 'document' | 'sticker' | 'video' | null => {
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

    console.log('AttendantDashboard init:', {
      attendant: attendant?.name,
      attendant_id: attendant?.id,
      dept: attendant?.department_id,
      sector: attendant?.sector_id,
      company: company?.name,
      company_id: company?.id,
      api_key: company?.api_key,
    });

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
  }, [attendant?.id, company?.id, company?.api_key]);

  useEffect(() => {
    if (selectedContact) {
      scrollToBottom(false);
      // Resetar o flag de scroll quando muda de contato
      isUserScrollingRef.current = false;
    }
  }, [selectedContact]);

  // ✅ FILTRO ESTRITO: NÃO deixa passar NULL
  function matchAttendantScope(item: { department_id?: string | null; sector_id?: string | null }) {
    const attDept = attendant?.department_id ?? null;
    const attSector = attendant?.sector_id ?? null;

    // se atendente não tem dept/setor, não mostra nada
    if (!attDept || !attSector) return false;

    // item precisa ter dept/setor preenchidos e bater exatamente
    if (!item.department_id || !item.sector_id) return false;

    return item.department_id === attDept && item.sector_id === attSector;
  }

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
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', company.id)
        .order('last_message_time', { ascending: false });

      if (error) throw error;

      const raw = (data || []) as ContactDB[];
      const filtered = raw.filter(matchAttendantScope);

      const withTags = await Promise.all(
        filtered.map(async (c) => {
          const { data: contactTags } = await supabase.from('contact_tags').select('tag_id').eq('contact_id', c.id);
          return { ...c, tag_ids: contactTags?.map((ct: any) => ct.tag_id) || [] };
        })
      );

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

    console.log('😊 Reações encontradas:', reactions.length);

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
      
      console.log(`😊 Reação: targetId=${targetId}, emoji=${emoji}`);
      
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

    console.log('🔍 Mapa de reações:', reactionMap);

    // Adicionar reações às mensagens originais
    const filtered = messages.filter(m => m.tipomessage !== 'reactionMessage');
    
    return filtered.map(msg => {
      const msgReactions = reactionMap.get(msg.idmessage) || reactionMap.get(msg.message) || reactionMap.get(msg.id) || [];
      
      if (msgReactions.length > 0) {
        console.log(`✨ Mensagem ${msg.idmessage} tem ${msgReactions.length} reações:`, msgReactions);
      }
      
      return {
        ...msg,
        reactions: msgReactions
      };
    });
  };

  const fetchMessages = async () => {
    if (!company?.api_key) {
      setMessages([]);
      return;
    }

    try {
      const [received, sent] = await Promise.all([
        supabase.from('messages').select('*').eq('apikey_instancia', company.api_key),
        supabase.from('sent_messages').select('*').eq('apikey_instancia', company.api_key),
      ]);

      if (received.error) throw received.error;
      if (sent.error) throw sent.error;

      let all: Message[] = [...(received.data || []), ...(sent.data || [])];

      // ✅ filtro estrito
      all = all.filter(matchAttendantScope);

      console.log('📩 Mensagens recebidas:', received.data?.length || 0);
      console.log('📤 Mensagens enviadas:', sent.data?.length || 0);
      console.log('✉️ Total de mensagens:', all.length);
      
      // Log para debugar reactionMessage
      const reactionMessages = all.filter(m => m.tipomessage === 'reactionMessage');
      if (reactionMessages.length > 0) {
        console.log('😊 REACTION MESSAGES ENCONTRADAS:', reactionMessages);
        reactionMessages.forEach((rm, idx) => {
          console.log(`  [${idx}] message="${rm.message}", caption="${rm.caption}", idmessage="${rm.idmessage}", id="${rm.id}"`);
        });
      }
      
      // Log para mensagens de sistema
      const systemMessages = all.filter(m => m.message_type === 'system_transfer');
      if (systemMessages.length > 0) {
        console.log('🎫 MENSAGENS DE SISTEMA ENCONTRADAS:', systemMessages);
      } else {
        console.log('⚠️ Nenhuma mensagem de sistema encontrada');
      }

      all.sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));

      // Processar reações
      const messagesWithReactions = processReactions(all);

      setMessages(messagesWithReactions);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
      setMessages([]);
    }
  };

  const subscribeToRealtime = () => {
    if (!company?.api_key || !company?.id) return;

    const channel = supabase
      .channel('attendant-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `apikey_instancia=eq.${company.api_key}` },
        () => {
          fetchMessages();
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sent_messages', filter: `apikey_instancia=eq.${company.api_key}` },
        () => {
          fetchMessages();
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `company_id=eq.${company.id}` },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Hook para monitorar mudanças em tempo real nas mensagens
  useRealtimeMessages({
    apiKey: company?.api_key,
    enabled: true,
    onMessagesChange: (message: Message) => {
      // Atualizar a lista de mensagens quando uma nova mensagem chega
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(m => m.id === message.id);
        if (messageExists) {
          return prevMessages.map(m => m.id === message.id ? message : m);
        }
        return [...prevMessages, message];
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

  // Carregar status IA do contato
  useEffect(() => {
    if (!selectedContact || contactsDB.length === 0) return;
    const contact = contactsDB.find(c => normalizePhone(c.phone_number) === normalizePhone(selectedContact));
    setIaAtivada(contact?.ia_ativada || false);
  }, [selectedContact, contactsDB]);

  // Hook para monitorar mudanças em tempo real nos contatos
  useRealtimeContacts({
    companyId: company?.id,
    enabled: true,
    onContactsChange: (contact: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`👥 Contato ${type}:`, contact);
      setContactsDB((prevContacts) => {
        const contactExists = prevContacts.some(c => c.id === contact.id);
        if (type === 'DELETE') {
          return prevContacts.filter(c => c.id !== contact.id);
        }
        if (contactExists) {
          return prevContacts.map(c => c.id === contact.id ? contact : c);
        }
        return [...prevContacts, contact];
      });
    }
  });

  // Polling automático como fallback - verifica a cada 3 segundos
  useEffect(() => {
    if (!company?.api_key) return;

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
  }, [company?.api_key]);

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

  // ======= AGRUPA CONTATOS PELAS MENSAGENS (normalizado) =======
  const contacts: Contact[] = useMemo(() => {
    const map = new Map<string, Contact>();

    for (const msg of messages) {
      const phone = normalizePhone(msg.numero || msg.sender || '');
      if (!phone) continue;

      if (!map.has(phone)) {
        const contactDB = contactsDB.find((c) => normalizePhone(c.phone_number) === phone);

        // SEMPRE usar nome do banco, nunca do pushname
        const contactName = contactDB?.name || phone;

        map.set(phone, {
          phoneNumber: phone,
          name: contactName,
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0,
          messages: [],
          department_id: contactDB?.department_id || undefined,
          sector_id: contactDB?.sector_id || undefined,
          tag_ids: contactDB?.tag_ids || [],
          contact_db_id: contactDB?.id || undefined,
        });
      }

      map.get(phone)!.messages.push(msg);
    }

    const arr = Array.from(map.values()).map((c) => {
      c.messages.sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
      const last = c.messages[c.messages.length - 1];
      c.lastMessage = last?.message || 'Mensagem';
      c.lastMessageTime = safeISO(last?.date_time || last?.created_at || null);
      
      // CRÍTICO: O nome SEMPRE vem do banco de dados
      // NUNCA usar pushname da mensagem - isto causa o problema de nome mudando
      const dbContact = contactsDB.find((db) => normalizePhone(db.phone_number) === c.phoneNumber);
      if (dbContact?.name) {
        c.name = dbContact.name;
      } else {
        c.name = c.phoneNumber;
      }

      // Contar mensagens pendentes (do cliente, não respondidas pelo atendente)
      const lastViewedTime = lastViewedMessageTime[c.phoneNumber] || 0;
      c.unreadCount = 0;
      
      // Procurar por mensagens não lidas do cliente que não foram respondidas
      for (let i = c.messages.length - 1; i >= 0; i--) {
        const msg = c.messages[i];
        const isSent = msg['minha?'] === 'true';
        const msgTime = getMessageTimestamp(msg);
        
        // Se é mensagem do cliente (não enviada pelo atendente)
        if (!isSent && msgTime > lastViewedTime) {
          // Verificar se há resposta DEPOIS dessa mensagem
          let hasResponse = false;
          for (let j = i + 1; j < c.messages.length; j++) {
            const responseMsg = c.messages[j];
            const isResponseSent = responseMsg['minha?'] === 'true';
            if (isResponseSent) {
              hasResponse = true;
              break;
            }
          }
          
          // Só contar como pendente se não tem resposta
          if (!hasResponse) {
            c.unreadCount++;
          }
        }
      }

      return c;
    });

    arr.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    return arr;
  }, [messages, contactsDB]);

  const filteredContacts = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(s) || c.phoneNumber.toLowerCase().includes(s));
  }, [contacts, searchTerm]);

  const selectedContactData = selectedContact ? contacts.find((c) => c.phoneNumber === selectedContact) : null;

  useEffect(() => {
    if (!selectedContact && contacts.length > 0) setSelectedContact(contacts[0].phoneNumber);
  }, [contacts, selectedContact]);

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
  }, [selectedContact, selectedContactData?.messages.length]);

  // Contar mensagens pendentes (novas mensagens que não foram vistas)
  useEffect(() => {
    if (!selectedContact || !selectedContactData?.messages) {
      setPendingMessagesCount(0);
      return;
    }

    const lastViewedTime = lastViewedMessageTime[selectedContact] || 0;
    const pendingCount = selectedContactData.messages.filter(msg => {
      const isSent = msg['minha?'] === 'true';
      const timestamp = msg.timestamp ? new Date(msg.timestamp).getTime() : msg.created_at ? new Date(msg.created_at).getTime() : 0;
      return !isSent && timestamp > lastViewedTime;
    }).length;

    setPendingMessagesCount(pendingCount);
  }, [messages, selectedContact, selectedContactData, lastViewedMessageTime]);

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
  const getDeptName = (deptId?: string | null): string | null => {
    if (!deptId) return null;
    return departmentsMap[deptId] || null;
  };

  // ======= ATUALIZAR TAGS DO CONTATO =======
  const handleUpdateContactInfo = async () => {
    if (!modalContactPhone || !company?.id) return;

    try {
      const contactDB = contactsDB.find((c) => normalizePhone(c.phone_number) === modalContactPhone);
      if (!contactDB) throw new Error('Contato não encontrado no DB');

      const currentTags = contactDB.tag_ids || [];
      const changed = selectedTags.length !== currentTags.length || !selectedTags.every((t) => currentTags.includes(t));

      if (!changed) {
        setToastMessage('Nenhuma alteração foi feita');
        setShowToast(true);
        return;
      }

      await supabase.from('contact_tags').delete().eq('contact_id', contactDB.id);

      if (selectedTags.length > 0) {
        const payload = selectedTags.slice(0, 5).map((tagId) => ({ contact_id: contactDB.id, tag_id: tagId }));
        const { error } = await supabase.from('contact_tags').insert(payload);
        if (error) throw error;
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
    if (!company || !company.api_key || !selectedContact) return;

    setSending(true);
    try {
      const generatedIdMessage = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('instancia, department_id, sector_id, tag_id')
        .eq('apikey_instancia', company.api_key)
        .eq('numero', selectedContact)
        .order('created_at', { ascending: false })
        .limit(1);

      const instanciaValue = lastMsg?.[0]?.instancia || company.name;
      const departmentId = lastMsg?.[0]?.department_id ?? attendant?.department_id ?? null;
      const sectorId = lastMsg?.[0]?.sector_id ?? attendant?.sector_id ?? null;
      const tagId = lastMsg?.[0]?.tag_id ?? null;

      const nowIso = new Date().toISOString();

      const rowToInsert: Message = {
        numero: selectedContact,
        sender: selectedContact,
        'minha?': 'true',
        pushname: attendant?.name || company.name,
        apikey_instancia: company.api_key,
        date_time: nowIso,
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
        apikey_instancia: company.api_key,

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
      const contact = contactsDB.find(c => normalizePhone(c.phone_number) === normalizePhone(selectedContact));
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
        departamentoDestino: departamentoTransferencia,
        apiKey: attendant.apikey_instancia
      });

      const dadosTransferencia = {
        api_key: attendant.apikey_instancia,
        numero_contato: parseInt(selectedContact.replace(/\D/g, ''), 10),
        nome_contato: currentContact.name,
        departamento_origem: 'Atendente',
        departamento_destino: departamentoTransferencia
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
          nomedept: departamentoTransferencia,
          nomecontato: currentContact.name
        });
        setShowTransferSuccessModal(true);
        
        setToastMessage(`✅ Contato transferido para ${departamentoTransferencia}`);
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

  const currentMessages = selectedContactData?.messages || [];
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
                    className={`w-full px-3 py-3 flex items-center gap-3 rounded-lg transition-all ${
                      selectedContact === contact.phoneNumber
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
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          iaAtivada 
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
                          const currentContact = contactsDB.find(c => normalizePhone(c.phone_number) === normalizePhone(selectedContact));
                          const currentDeptId = currentContact?.department_id;
                          const currentDeptName = currentContact ? departmentsMap[currentContact.department_id] : null;
                          return (
                            <option key={dept.id} value={dept.name} disabled={dept.id === currentDeptId}>
                              {dept.name} {dept.id === currentDeptId ? '(departamento atual)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {departamentoTransferencia && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✅ Será transferido para: <span className="font-semibold">{departamentoTransferencia}</span>
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
                          const senderLabel = isSentMessage ? (msg.pushname || attendant?.name) : msg.pushname;
                          const tipoFromField = getMessageTypeFromTipomessage(msg.tipomessage);
                          const hasBase64Content = msg.base64;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSentMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl ${
                                  isSentMessage
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
                                    <div className={`flex items-center gap-3 p-3 rounded-xl ${
                                      isSentMessage ? 'bg-blue-600' : 'bg-gray-50'
                                    }`}>
                                      <button
                                        onClick={() => handleAudioPlay(msg.id || '', msg.base64!)}
                                        className={`p-2 rounded-full ${
                                          isSentMessage ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'
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

                                {hasBase64Content && (tipoFromField === 'document') &&
                                  tipoFromField !== 'audio' &&
                                  tipoFromField !== 'image' &&
                                  tipoFromField !== 'sticker' &&
                                  tipoFromField !== 'video' && (
                                  <div className="p-2">
                                    <button
                                      onClick={() => downloadBase64File(msg.base64!, msg.message || 'documento.pdf')}
                                      className={`flex items-center gap-2 p-2.5 rounded-xl w-full ${
                                        isSentMessage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 hover:bg-gray-100'
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
                    if (selectedContactData?.messages) {
                      const lastMsgTime = selectedContactData.messages.reduce((max, msg) => {
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
                  {filePreview && (
                    <div className="relative inline-block">
                      <img src={filePreview} alt="preview" className="h-24 rounded-lg" />
                      <button
                        onClick={clearSelectedFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 text-sky-500 hover:bg-sky-50 rounded-lg transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-sky-500 hover:bg-sky-50 rounded-lg transition-all"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <input
                      ref={messageInputRef}
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onPaste={handlePasteContent}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem (ou cole imagem/arquivo)..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-900 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
                      disabled={sending}
                    />

                    <EmojiPicker 
                      onSelect={(emoji) => setMessageText(prev => prev + emoji)}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={sending || (!messageText.trim() && !selectedFile)}
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
