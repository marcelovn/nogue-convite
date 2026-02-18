import { CardTheme, ColorScheme } from './card.model';

export const THEMES: CardTheme[] = [
  {
    id: 'cute-bear',
    name: 'Cute Bear',
    font: 'Poppins',
    description: 'Adorable and playful design with bear theme',
    isPremium: false,
    backgroundColor: '#FFF5F7',
    accentColor: '#FFB3D9'
  },
  {
    id: 'sweet-hearts',
    name: 'Sweet Hearts',
    font: 'Lora',
    description: 'Romantic heart theme with elegant typography',
    isPremium: false,
    backgroundColor: '#FFF0F5',
    accentColor: '#FF69B4'
  },
  {
    id: 'pink-piggy',
    name: 'Pink Piggy',
    font: 'Quicksand',
    description: 'Cute pink pig character theme',
    isPremium: false,
    backgroundColor: '#FFE4E1',
    accentColor: '#FF1493'
  },
  {
    id: 'bold-frame',
    name: 'Bold Frame',
    font: 'Montserrat',
    description: 'Modern bold lines and frames',
    isPremium: false,
    backgroundColor: '#F5F5F5',
    accentColor: '#FF006E'
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    font: 'Dancing Script',
    description: 'Soft and dreamy pastel design',
    isPremium: false,
    backgroundColor: '#F0E6FF',
    accentColor: '#D8BFD8'
  },
  {
    id: 'vintage-tag',
    name: 'Vintage Tag',
    font: 'Playfair Display',
    description: 'Classic vintage postcard style',
    isPremium: false,
    backgroundColor: '#FFF8DC',
    accentColor: '#CD853F'
  },
  {
    id: 'love-letter',
    name: 'Love Letter',
    font: 'Caveat',
    description: 'Handwritten love letter aesthetic',
    isPremium: false,
    backgroundColor: '#FFFAF0',
    accentColor: '#DC143C'
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    font: 'Space Mono',
    description: 'Vibrant neon glowing text',
    isPremium: false,
    backgroundColor: '#0A0E27',
    accentColor: '#00FF00'
  },
  {
    id: 'royal',
    name: 'Royal',
    font: 'Cormorant Garamond',
    description: 'Elegant royal and luxurious design',
    isPremium: false,
    backgroundColor: '#1A1A2E',
    accentColor: '#FFD700'
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    font: 'Varela Round',
    description: 'Soft pastel colors with smooth design',
    isPremium: false,
    backgroundColor: '#FFEEF8',
    accentColor: '#FFB6D9'
  }
];

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'classic-pink',
    name: 'Classic Pink',
    primary: '#FF69B4',
    secondary: '#FFB6D9',
    accent: '#FF1493',
    background: '#FFF0F5',
    text: '#333333'
  },
  {
    id: 'rose-red',
    name: 'Rose Red',
    primary: '#C71585',
    secondary: '#FF69B4',
    accent: '#FF1493',
    background: '#FFF5EE',
    text: '#2F2F2F'
  },
  {
    id: 'purple-love',
    name: 'Purple Love',
    primary: '#9932CC',
    secondary: '#DA70D6',
    accent: '#EE82EE',
    background: '#F5F0FF',
    text: '#222222'
  },
  {
    id: 'coral-crush',
    name: 'Coral Crush',
    primary: '#FF7F50',
    secondary: '#FFB6A3',
    accent: '#FF6347',
    background: '#FFF0E6',
    text: '#333333'
  },
  {
    id: 'hot-pink',
    name: 'Hot Pink',
    primary: '#FF20E0',
    secondary: '#FF69B4',
    accent: '#FF1493',
    background: '#FFF0FB',
    text: '#2F2F2F'
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    primary: '#FF00FF',
    secondary: '#FF69B4',
    accent: '#FF1493',
    background: '#FFF5FE',
    text: '#333333'
  },
  {
    id: 'violet',
    name: 'Violet',
    primary: '#8B00FF',
    secondary: '#DA70D6',
    accent: '#EE82EE',
    background: '#F8F5FF',
    text: '#2F2F2F'
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    primary: '#0077BE',
    secondary: '#00A8E8',
    accent: '#00D4FF',
    background: '#E0F7FF',
    text: '#1F1F1F'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primary: '#00A86B',
    secondary: '#50C878',
    accent: '#3CB371',
    background: '#F0FFF0',
    text: '#1F1F1F'
  },
  {
    id: 'golden',
    name: 'Golden',
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FF8C00',
    background: '#FFFEF0',
    text: '#333333'
  },
  {
    id: 'true-red',
    name: 'True Red',
    primary: '#FF0000',
    secondary: '#FF6347',
    accent: '#DC143C',
    background: '#FFF5F5',
    text: '#2F2F2F'
  },
  {
    id: 'teal',
    name: 'Teal',
    primary: '#008080',
    secondary: '#20B2AA',
    accent: '#48D1CC',
    background: '#F0FFFF',
    text: '#1F1F1F'
  }
];

export const NO_BUTTON_MECHANICS = [
  { id: 'teleporting', label: 'Não Foge', description: '👻 O botão "Não" desaparece!' },
  { id: 'growing-yes', label: 'Sim Cresce', description: '📈 Botão "Sim" cresce gigante' },
  { id: 'multiplying-yes', label: 'Sim Multiplica', description: '✨ Vários "Sim" aparecem na tela' },
  { id: 'shrinking-no', label: 'Não Encolhe', description: '🔍 Botão "Não" fica minúsculo' }
];
