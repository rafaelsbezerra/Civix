import { useEffect, useId, useRef, useState } from 'react';
import type { CompanyImagePurpose } from '../../lib/api';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';

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
  return <Field data-invalid={!!error || undefined} className="gap-2.5">
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Input
      id={id}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      disabled={disabled}
      aria-describedby={id + '-help'}
      aria-invalid={!!error}
      className="h-11 cursor-pointer bg-background py-2 file:mr-3 file:rounded-md file:bg-muted file:px-3 file:py-1 file:text-xs file:font-medium file:text-foreground"
      onChange={event => {
        const selected = event.target.files?.[0] ?? null;
        const message = selected && (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size <= 0 || selected.size > 10000000)
          ? 'Selecione uma imagem PNG, JPG ou WEBP de até 10 MB, não vazia.' : '';
        event.target.setCustomValidity(message);
        setError(message);
        onChange(message ? null : selected);
      }}
    />
    <FieldDescription id={id + '-help'} className="text-xs">
      PNG, JPG ou WEBP, até 10 MB. {purpose === 'logo' ? 'Envio após a criação da empresa.' : 'O envio substitui somente a capa e não altera o plano ou as vendas.'}
    </FieldDescription>
    {error && <FieldError>{error}</FieldError>}
    <img
      ref={preview}
      hidden={!file && !currentUrl}
      className={purpose === 'logo'
        ? 'mt-2 max-h-28 w-auto rounded-xl border bg-muted/30 p-2 object-contain'
        : 'mt-2 max-h-48 w-full rounded-xl border bg-muted/30 object-cover'}
      alt={'Prévia: ' + label.toLowerCase()}
    />
  </Field>;
}
