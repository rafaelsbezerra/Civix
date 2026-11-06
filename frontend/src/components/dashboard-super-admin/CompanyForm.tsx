import { useId, useState, type CSSProperties } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { CompanyRegistrationInput, Plan, PlatformCompany } from '../../lib/api';
import { CompanyImageInput } from './CompanyImageInput';

const companyFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da empresa.'),
  cnpj: z.string().trim().min(1, 'Informe o CNPJ.'),
  categoria: z.string().trim().min(1, 'Informe a categoria.'),
  tamanho: z.enum(['pequena', 'media', 'grande'], { message: 'Selecione o porte da empresa.' }),
  descricao: z.string().trim().min(1, 'Informe o resumo da empresa.'),
  descricao_detalhada: z.string().trim().min(1, 'Informe a descrição detalhada.'),
  cidade: z.string().trim().min(1, 'Informe a cidade.'),
  estado: z.string().trim().min(1, 'Informe o estado.'),
  email: z.string().trim().refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Informe um e-mail válido.'),
  telefone: z.string(),
  endereco: z.string(),
  website: z.string().trim().refine(value => !value || /^https?:\/\/.+/i.test(value), 'Informe uma URL válida.'),
  whatsapp: z.string(),
  planId: z.string().trim().min(1, 'Selecione um plano comercial.'),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

const selectTriggerClass = 'w-full min-h-11 border-input! bg-muted/40 text-foreground hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50';
const inputClass = 'h-11 bg-background';
const sizeOptions = [
  { value: 'pequena', label: 'Pequena' },
  { value: 'media', label: 'Média' },
  { value: 'grande', label: 'Grande' },
];
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const themeVariables = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export function CompanyForm({ plans, busy, onSave, company }: {
  plans: Plan[];
  busy: boolean;
  company?: PlatformCompany;
  onSave: (input: Omit<CompanyRegistrationInput, 'operationId'>, logo?: File | null) => void | Promise<void>;
}) {
  const id = useId();
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      nome: company?.nome ?? '',
      cnpj: company?.cnpj ?? '',
      descricao: company?.descricao ?? '',
      descricao_detalhada: company?.descricao_detalhada ?? '',
      categoria: company?.categoria ?? '',
      cidade: company?.cidade ?? '',
      estado: company?.estado ?? '',
      tamanho: company?.tamanho ?? 'pequena',
      email: company?.email ?? '',
      telefone: company?.telefone ?? '',
      endereco: company?.endereco ?? '',
      website: company?.website ?? '',
      whatsapp: company?.whatsapp ?? '',
      planId: company?.plan_id ? String(company.plan_id) : '',
    },
  });

  const selectedPlanId = useWatch({ control, name: 'planId' });
  const selected = plans.find(plan => plan.id === selectedPlanId);
  const planOptions = [
    { value: '', label: 'Selecione um plano' },
    ...plans.map(plan => ({
      value: plan.id,
      label: `${plan.name}${!plan.isActive ? ' (inativo — vínculo atual)' : ''} — ${currency.format(Number(plan.price))}`,
    })),
  ];

  const submit = handleSubmit(values => {
    void onSave({
      nome: values.nome,
      cnpj: values.cnpj,
      descricao: values.descricao,
      descricao_detalhada: values.descricao_detalhada,
      categoria: values.categoria,
      cidade: values.cidade,
      estado: values.estado,
      tamanho: values.tamanho,
      planId: values.planId,
      ...(values.email || company ? { email: values.email || null } : {}),
      ...(values.telefone || company ? { telefone: values.telefone || null } : {}),
      ...(values.endereco || company ? { endereco: values.endereco || null } : {}),
      ...(values.website || company ? { website: values.website || null } : {}),
      ...(values.whatsapp || company ? { whatsapp: values.whatsapp || null } : {}),
    }, logo);
  });

  return (
    <div ref={setPortal} style={themeVariables}>
      <form onSubmit={submit} noValidate className="space-y-6" aria-label={company ? 'Editar empresa' : 'Cadastrar empresa com plano'}>
        <Card className="rounded-2xl py-5">
          <CardHeader className="px-5">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="tabular-nums">01</Badge>
              <CardTitle className="text-base font-semibold">Identificação</CardTitle>
            </div>
            <CardDescription className="text-xs">Dados cadastrais e apresentação institucional da empresa.</CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <FieldSet disabled={busy}>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.nome || undefined}>
                  <FieldLabel htmlFor={id + '-nome'}>Nome da empresa</FieldLabel>
                  <Input id={id + '-nome'} required aria-invalid={!!errors.nome} className={inputClass} {...register('nome')} />
                  <FieldError errors={[errors.nome]} />
                </Field>
                <Field data-invalid={!!errors.cnpj || undefined}>
                  <FieldLabel htmlFor={id + '-cnpj'}>CNPJ</FieldLabel>
                  <Input id={id + '-cnpj'} required aria-invalid={!!errors.cnpj} className={inputClass} {...register('cnpj')} />
                  <FieldError errors={[errors.cnpj]} />
                </Field>
                <Field data-invalid={!!errors.categoria || undefined}>
                  <FieldLabel htmlFor={id + '-categoria'}>Categoria</FieldLabel>
                  <Input id={id + '-categoria'} required aria-invalid={!!errors.categoria} className={inputClass} {...register('categoria')} />
                  <FieldError errors={[errors.categoria]} />
                </Field>
                <Controller
                  control={control}
                  name="tamanho"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={id + '-tamanho'}>Porte</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={value => field.onChange(value ?? 'pequena')}
                        items={sizeOptions}
                        disabled={busy}
                      >
                        <SelectTrigger id={id + '-tamanho'} aria-invalid={fieldState.invalid} className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent container={portal} alignItemWithTrigger={false}>
                          {sizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Field data-invalid={!!errors.descricao || undefined} className="sm:col-span-2">
                  <FieldLabel htmlFor={id + '-descricao'}>Resumo</FieldLabel>
                  <Input id={id + '-descricao'} required aria-invalid={!!errors.descricao} className={inputClass} {...register('descricao')} />
                  <FieldError errors={[errors.descricao]} />
                </Field>
                <Field data-invalid={!!errors.descricao_detalhada || undefined} className="sm:col-span-2">
                  <FieldLabel htmlFor={id + '-descricao-detalhada'}>Descrição detalhada</FieldLabel>
                  <Textarea
                    id={id + '-descricao-detalhada'}
                    required
                    aria-invalid={!!errors.descricao_detalhada}
                    className="min-h-28 bg-background"
                    {...register('descricao_detalhada')}
                  />
                  <FieldError errors={[errors.descricao_detalhada]} />
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-5">
          <CardHeader className="px-5">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="tabular-nums">02</Badge>
              <CardTitle className="text-base font-semibold">Localização e contato</CardTitle>
            </div>
            <CardDescription className="text-xs">Cidade, estado e canais de contato divulgados no perfil.</CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <FieldSet disabled={busy}>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.cidade || undefined}>
                  <FieldLabel htmlFor={id + '-cidade'}>Cidade</FieldLabel>
                  <Input id={id + '-cidade'} required aria-invalid={!!errors.cidade} className={inputClass} {...register('cidade')} />
                  <FieldError errors={[errors.cidade]} />
                </Field>
                <Field data-invalid={!!errors.estado || undefined}>
                  <FieldLabel htmlFor={id + '-estado'}>Estado</FieldLabel>
                  <Input id={id + '-estado'} required aria-invalid={!!errors.estado} className={inputClass} {...register('estado')} />
                  <FieldError errors={[errors.estado]} />
                </Field>
                <Field data-invalid={!!errors.email || undefined}>
                  <FieldLabel htmlFor={id + '-email'}>E-mail da empresa</FieldLabel>
                  <Input id={id + '-email'} type="email" aria-invalid={!!errors.email} className={inputClass} {...register('email')} />
                  <FieldError errors={[errors.email]} />
                </Field>
                <Field data-invalid={!!errors.telefone || undefined}>
                  <FieldLabel htmlFor={id + '-telefone'}>Telefone</FieldLabel>
                  <Input id={id + '-telefone'} type="tel" aria-invalid={!!errors.telefone} className={inputClass} {...register('telefone')} />
                  <FieldError errors={[errors.telefone]} />
                </Field>
                <Field data-invalid={!!errors.endereco || undefined}>
                  <FieldLabel htmlFor={id + '-endereco'}>Endereço</FieldLabel>
                  <Input id={id + '-endereco'} aria-invalid={!!errors.endereco} className={inputClass} {...register('endereco')} />
                  <FieldError errors={[errors.endereco]} />
                </Field>
                <Field data-invalid={!!errors.website || undefined}>
                  <FieldLabel htmlFor={id + '-website'}>Site</FieldLabel>
                  <Input id={id + '-website'} type="url" aria-invalid={!!errors.website} className={inputClass} {...register('website')} />
                  <FieldError errors={[errors.website]} />
                </Field>
                <Field data-invalid={!!errors.whatsapp || undefined}>
                  <FieldLabel htmlFor={id + '-whatsapp'}>WhatsApp</FieldLabel>
                  <Input id={id + '-whatsapp'} type="tel" aria-invalid={!!errors.whatsapp} className={inputClass} {...register('whatsapp')} />
                  <FieldError errors={[errors.whatsapp]} />
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-5">
          <CardHeader className="px-5">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="tabular-nums">03</Badge>
              <CardTitle className="text-base font-semibold">Plano comercial</CardTitle>
            </div>
            <CardDescription className="text-xs">Defina o plano comercial vinculado à empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <FieldSet disabled={busy}>
              <Controller
                control={control}
                name="planId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor={id + '-plan'}>Plano comercial</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={value => field.onChange(value ?? '')}
                      items={planOptions}
                      disabled={busy}
                    >
                      <SelectTrigger id={id + '-plan'} aria-invalid={fieldState.invalid} className={selectTriggerClass}>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent container={portal} alignItemWithTrigger={false}>
                        {planOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldSet>
            {selected && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">
                <strong className="text-sm font-semibold">{selected.name}</strong>
                <Badge variant="outline" className="font-semibold tabular-nums">
                  {currency.format(Number(selected.price))}
                </Badge>
                <p className="w-full text-xs text-muted-foreground">
                  {company
                    ? 'A alteração do plano não gera uma venda automática. Registre a venda manualmente na área de vendas.'
                    : 'O valor vigente do plano será registrado pelo servidor no momento da confirmação.'}
                </p>
              </div>
            )}
            <FieldDescription className="text-xs">
              {company
                ? 'A alteração do plano não gera uma venda automática. Registre a venda manualmente na área de vendas.'
                : 'Este cadastro registra uma venda comercial inicial. Não realiza cobrança nem cria assinatura. O convite da equipe é uma etapa separada.'}
            </FieldDescription>
          </CardContent>
        </Card>

        {!company && (
          <Card className="rounded-2xl py-5">
            <CardHeader className="px-5">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="tabular-nums">04</Badge>
                <CardTitle className="text-base font-semibold">Logo</CardTitle>
              </div>
              <CardDescription className="text-xs">Imagem opcional de identificação da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <FieldSet disabled={busy}>
                <CompanyImageInput purpose="logo" file={logo} onChange={setLogo} disabled={busy} />
              </FieldSet>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button className="min-h-11 rounded-xl px-5" type="submit" disabled={busy || !plans.length}>
            {busy ? 'Salvando…' : company ? 'Salvar empresa' : 'Cadastrar empresa e registrar venda'}
          </Button>
        </div>
      </form>
    </div>
  );
}
