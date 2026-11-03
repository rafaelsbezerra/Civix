import { useEffect, useId, useRef, useState } from 'react';
import type { CompanyImagePurpose } from '../../lib/api';

export function CompanyImageInput({ purpose, file, onChange, currentUrl, disabled = false }: {
  purpose: CompanyImagePurpose; file: File | null; onChange: (file: File | null) => void;
  currentUrl?: string | null; disabled?: boolean;
}) {
  const id = useId();
  const preview = useRef<HTMLImageElement>(null);
  const [error, setError] = useState('');
  const label = purpose === 'logo' ? 'Logo da empresa' : 'Capa da empresa';
  useEffect(() => {
    const image = preview.current;
    if (!image) return;
    if (!file) {
      if (currentUrl) image.src = currentUrl;
      else image.removeAttribute('src');
      return;
    }
    const url = URL.createObjectURL(file);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, currentUrl]);
  return <div className="sa-image-field">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled}
      aria-describedby={id + '-help'} aria-invalid={!!error} onChange={event => {
        const selected = event.target.files?.[0] ?? null;
        const message = selected && (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size <= 0 || selected.size > 10000000)
          ? 'Selecione uma imagem PNG, JPG ou WEBP de até 10 MB, não vazia.' : '';
        event.target.setCustomValidity(message);
        setError(message);
        onChange(message ? null : selected);
      }} />
    <p id={id + '-help'} className="sa-footnote">PNG, JPG ou WEBP, até 10 MB. {purpose === 'logo' ? 'Envio após a criação da empresa.' : 'O envio substitui somente a capa e não altera o plano ou as vendas.'}</p>
    {error && <p role="alert" className="sa-error">{error}</p>}
    <img ref={preview} hidden={!file && !currentUrl} className={'sa-image-preview sa-image-preview-' + purpose} alt={'Prévia: ' + label.toLowerCase()} />
  </div>;
}
