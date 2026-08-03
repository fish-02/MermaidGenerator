export interface ColorOption {
  color: string | undefined
  label: string
}

export const COLOR_OPTIONS: ColorOption[] = [
  { color: undefined, label: '預設（清除顏色）' },
  { color: '#fecaca', label: '紅' },
  { color: '#fed7aa', label: '橘' },
  { color: '#fef08a', label: '黃' },
  { color: '#bbf7d0', label: '綠' },
  { color: '#bfdbfe', label: '藍' },
  { color: '#ddd6fe', label: '紫' },
  { color: '#e5e7eb', label: '灰' },
]
