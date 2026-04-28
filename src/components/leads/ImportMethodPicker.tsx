import { motion } from 'framer-motion';
import { Upload, MessageCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onPickFile: () => void;
  onPickWhatsApp: () => void;
}

const methods = [
  {
    key: 'file' as const,
    icon: Upload,
    title: 'Arquivo ou texto',
    description: 'Importe de CSV, TXT ou cole uma lista de contatos manualmente.',
  },
  {
    key: 'whatsapp' as const,
    icon: MessageCircle,
    title: 'Conversas do WhatsApp',
    description: 'Importe leads diretamente das suas conversas do WhatsApp.',
  },
];

export function ImportMethodPicker({ open, onClose, onPickFile, onPickWhatsApp }: Props) {
  function handlePick(key: 'file' | 'whatsapp') {
    onClose();
    if (key === 'file') onPickFile();
    else onPickWhatsApp();
  }

  return (
    <Modal open={open} onClose={onClose} title="Importar leads" maxWidth="md">
      <p className="text-sm text-white/55 mb-5">
        Escolha como deseja importar seus leads.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methods.map((m) => {
          const Icon = m.icon;
          return (
            <motion.button
              key={m.key}
              type="button"
              onClick={() => handlePick(m.key)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="text-left p-5 rounded-2xl border-2 border-white/[0.08] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center mb-3">
                <Icon size={20} className="text-white/70" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{m.title}</h4>
              <p className="text-xs text-white/50 leading-relaxed">{m.description}</p>
            </motion.button>
          );
        })}
      </div>
    </Modal>
  );
}
