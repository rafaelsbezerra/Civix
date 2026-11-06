import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { Plan, PlanInput } from '../../lib/api';

const PERIOD_LABELS: Record<PlanInput['billingPeriod'], string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  one_time: 'Único',
};

const planFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do plano.').max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Informe um identificador (slug) válido.')
    .max(120),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, 'Informe um preço válido em reais.'),
  billingPeriod: z.enum(['monthly', 'yearly', 'one_time']),
  description: z.string().max(3000),
  featuresText: z.string(),
  displayOrder: z.number().int('Informe um número inteiro.').min(0, 'A ordem deve ser maior ou igual a zero.'),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

function toFormValues(plan?: Plan): PlanFormValues {
  if (!plan) {
    return {
      name: '',
      slug: '',
      price: '',
      billingPeriod: 'monthly',
      description: '',
      featuresText: '',
      displayOrder: 10,
      isActive: true,
      isFeatured: false,
    };
  }
  return {
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
    billingPeriod: plan.billingPeriod,
    description: plan.description,
    featuresText: plan.features.join('\n'),
    displayOrder: plan.displayOrder,
    isActive: plan.isActive,
    isFeatured: plan.isFeatured,
  };
}

export function PlanForm({
  plan,
  busy,
  onSave,
  onCancel,
}: {
  plan?: Plan;
  busy: boolean;
  onSave: (input: PlanInput) => void;
  onCancel: () => void;
}) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: toFormValues(plan),
  });

  useEffect(() => {
    reset(toFormValues(plan));
  }, [plan, reset]);

  const onSubmit = (values: PlanFormValues) => {
    const normalizedPrice = Number(values.price.replace(',', '.')).toFixed(2);
    const payload: PlanInput = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description,
      price: normalizedPrice,
      billingPeriod: values.billingPeriod,
      features: values.featuresText
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean),
      limits: plan?.limits ?? {},
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      displayOrder: values.displayOrder,
    };
    onSave(payload);
  };

  return (
    <div ref={setPortal}>
      <Card className="rounded-2xl">
        <CardHeader className="border-b pb-5">
          <CardTitle className="text-base font-semibold">
            {plan ? 'Editar plano' : 'Novo plano'}
          </CardTitle>
          <CardDescription>
            Dados comerciais. Recursos são descritivos; não definem permissões.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            aria-label={plan ? 'Editar plano' : 'Novo plano'}
            className="space-y-6"
          >
            <FieldSet>
              <FieldGroup className="grid gap-5 md:grid-cols-2">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="plan-name">Nome do plano</FieldLabel>
                  <Input
                    id="plan-name"
                    maxLength={120}
                    aria-invalid={!!errors.name}
                    {...register('name')}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field data-invalid={!!errors.slug}>
                  <FieldLabel htmlFor="plan-slug">Identificador (slug)</FieldLabel>
                  <Input
                    id="plan-slug"
                    maxLength={120}
                    placeholder="ex.: profissional"
                    aria-invalid={!!errors.slug}
                    {...register('slug')}
                  />
                  <FieldError errors={[errors.slug]} />
                </Field>

                <Field data-invalid={!!errors.price}>
                  <FieldLabel htmlFor="plan-price">Preço em reais</FieldLabel>
                  <Input
                    id="plan-price"
                    inputMode="decimal"
                    placeholder="59.90"
                    aria-invalid={!!errors.price}
                    {...register('price')}
                  />
                  <FieldDescription>Valor positivo, com até duas casas decimais.</FieldDescription>
                  <FieldError errors={[errors.price]} />
                </Field>

                <Controller
                  control={control}
                  name="billingPeriod"
                  render={({ field }) => (
                    <Field data-invalid={!!errors.billingPeriod}>
                      <FieldLabel htmlFor="plan-billing-period">Período comercial</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="plan-billing-period"
                          aria-label="Período comercial"
                          className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
                        >
                          <SelectValue>{PERIOD_LABELS[field.value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent container={portal} alignItemWithTrigger={false}>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                          <SelectItem value="one_time">Único</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.billingPeriod]} />
                    </Field>
                  )}
                />

                <Field className="md:col-span-2" data-invalid={!!errors.description}>
                  <FieldLabel htmlFor="plan-description">Descrição</FieldLabel>
                  <Textarea
                    id="plan-description"
                    maxLength={3000}
                    rows={3}
                    aria-invalid={!!errors.description}
                    {...register('description')}
                  />
                  <FieldError errors={[errors.description]} />
                </Field>

                <Field className="md:col-span-2" data-invalid={!!errors.featuresText}>
                  <FieldLabel htmlFor="plan-features">Recursos apresentados</FieldLabel>
                  <Textarea
                    id="plan-features"
                    rows={4}
                    aria-invalid={!!errors.featuresText}
                    {...register('featuresText')}
                  />
                  <FieldDescription>Um recurso por linha.</FieldDescription>
                  <FieldError errors={[errors.featuresText]} />
                </Field>

                <Field data-invalid={!!errors.displayOrder}>
                  <FieldLabel htmlFor="plan-display-order">Ordem de exibição</FieldLabel>
                  <Input
                    id="plan-display-order"
                    type="number"
                    step="1"
                    aria-invalid={!!errors.displayOrder}
                    {...register('displayOrder', { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.displayOrder]} />
                </Field>

                <div className="flex flex-col justify-center gap-3 pt-2">
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Field orientation="horizontal" className="items-center gap-2.5">
                        <Checkbox
                          id="plan-is-active"
                          checked={field.value}
                          onCheckedChange={checked => field.onChange(Boolean(checked))}
                        />
                        <FieldLabel htmlFor="plan-is-active" className="cursor-pointer font-normal">
                          Disponível para novos cadastros
                        </FieldLabel>
                      </Field>
                    )}
                  />

                  <Controller
                    control={control}
                    name="isFeatured"
                    render={({ field }) => (
                      <Field orientation="horizontal" className="items-center gap-2.5">
                        <Checkbox
                          id="plan-is-featured"
                          checked={field.value}
                          onCheckedChange={checked => field.onChange(Boolean(checked))}
                        />
                        <FieldLabel htmlFor="plan-is-featured" className="cursor-pointer font-normal">
                          Destacar no catálogo
                        </FieldLabel>
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 px-4"
                disabled={busy}
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" className="min-h-10 px-5" disabled={busy}>
                {busy ? 'Salvando…' : 'Salvar plano'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
