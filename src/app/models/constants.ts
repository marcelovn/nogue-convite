import { CardTheme, ColorScheme } from './card.model';

export const THEMES: CardTheme[] = [
  {
    id: 'elegant-minimal',
    name: 'Elegante Minimalista',
    font: 'Poppins',
    description: 'Design limpo e sofisticado com acabamento premium',
    isPremium: false,
    backgroundColor: '#FFFFFF',
    accentColor: '#2D3436'
  },
  {
    id: 'romantic-glow',
    name: 'Romântico Radiante',
    font: 'Lora',
    description: 'Tons quentes e aconchegantes para momentos especiais',
    isPremium: false,
    backgroundColor: '#FFF5F7',
    accentColor: '#FF6B9D'
  },
  {
    id: 'vibrant-party',
    name: 'Festa Colorida',
    font: 'Fredoka One',
    description: 'Cores vibrantes e dinâmicas cheias de alegria',
    isPremium: false,
    backgroundColor: '#FFF9E6',
    accentColor: '#FF6B6B'
  },
  {
    id: 'luxury-gold',
    name: 'Luxo Dourado',
    font: 'Playfair Display',
    description: 'Elegância atemporal com toques de ouro e sofisticação',
    isPremium: false,
    backgroundColor: '#1A1A1A',
    accentColor: '#FFD700'
  },
  {
    id: 'ocean-serene',
    name: 'Oceano Tranquilo',
    font: 'Quicksand',
    description: 'Azuis suaves perfeitos para ocasiões tranquilas e elegantes',
    isPremium: false,
    backgroundColor: '#E8F4F8',
    accentColor: '#0097A7'
  }
];

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'classic-pink',
    name: 'Azul Clássico',
    primary: '#1E63FF',
    secondary: '#5B9EFF',
    accent: '#0040D4',
    background: '#E8F2FF',
    text: '#1A1A1A'
  },
  {
    id: 'purple-love',
    name: 'Roxo Amor',
    primary: '#B71FFF',
    secondary: '#E547FF',
    accent: '#8B00FF',
    background: '#F8E8FF',
    text: '#1A1A1A'
  },
  {
    id: 'coral-crush',
    name: 'Coral Intenso',
    primary: '#FF5722',
    secondary: '#FF8A65',
    accent: '#FF3D00',
    background: '#FFE8D8',
    text: '#1A1A1A'
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    primary: '#00C853',
    secondary: '#1DE9B6',
    accent: '#00BFA5',
    background: '#E0F7F2',
    text: '#1A1A1A'
  },
  {
    id: 'true-red',
    name: 'Vermelho Verdadeiro',
    primary: '#FF1744',
    secondary: '#FF5252',
    accent: '#D50000',
    background: '#FFE8EC',
    text: '#1A1A1A'
  }
];

export const NO_BUTTON_MECHANICS = [
  { id: 'teleporting', label: 'Não Foge', description: '👻 O botão "Não" desaparece!' },
  { id: 'growing-yes', label: 'Sim Cresce', description: '📈 Botão "Sim" cresce gigante' },
  { id: 'multiplying-yes', label: 'Sim Multiplica', description: '✨ Vários "Sim" aparecem na tela' },
  { id: 'shrinking-no', label: 'Não Encolhe', description: '🔍 Botão "Não" fica minúsculo' }
];
