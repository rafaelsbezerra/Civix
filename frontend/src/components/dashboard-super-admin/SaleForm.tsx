import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ManualSaleDraft, Plan, PlatformCompany } from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '../ui/field';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

const PRICING_MODE_LABELS: Record<'company_plan' | 'manual_amount', string> = {
  company_plan: 'Plano atual da empresa',
  manual_amount: 'Valor manual com motivo',
};

const saleFormSchema = z
  .object({
    pricingMode: z.enum(['company_plan', 'manual_amount']),
    soldAt: z.string().min(1, 'Informe a data comercial (UTC).'),
    amount: z.string(),
    description: z.string().max(3000),
  })
  .superRefine((values, ctx) => {
    const parsedDate = new Date(values.soldAt + 'Z');
    if (Number.isNaN(parsedDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['soldAt'],
        message: 'Informe uma data comercial válida em UTC.',
      });
    }
    if (values.pricingMode === 'manual_amount') {
      const normalized = values.amount.trim().replace(',', '.');
      if (!/^\d+(?:\.\d{1,2})?$/.test(normalized) || Number(normalized) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: 'Informe um valor manual positivo em reais.',
        });
      }
      if (!values.description.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['description'],
          message: 'Informe a descrição / motivo.',
        });
      }
    }
  });

type SaleFormValues = z.infer<typeof saleFormSchema>;

export function SaleForm({
  company,
  plan,
  busy,
  onSave,
}: {
  company: PlatformCompany;
  plan?: Plan;
  busy: boolean;
  onSave: (input: ManualSaleDraft) => void;
}) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const planEligible = !!plan?.isActive && Number(plan.price) > 0;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      pricingMode: planEligible ? 'company_plan' : 'manual_amount',
      soldAt: new Date().toISOString().slice(0, 16),
      amount: '',
      description: '',
    },
  });

  const pricingMode = useWatch({ control, name: 'pricingMode' });

  const onSubmit = (values: SaleFormValues) => {
    const common = {
      companyId: company.id,
      soldAt: new Date(values.soldAt + 'Z').toISOString(),
    };
    if (values.pricingMode === 'company_plan') {
      const trimmedDescription = values.description.trim();
      onSave({
        ...common,
        pricingMode: 'company_plan',
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      return;
    }
    onSave({
      ...common,
      pricingMode: 'manual_amount',
      amount: values.amount.trim().replace(',', '.'),
      description: values.description.trim(),
    });
  };

  return (
    <div ref={setPortal}>
      <Card className="rounded-2xl">
        <CardHeader className="border-b pb-5">
          <CardTitle className="text-base font-semibold">
            Venda para {company.nome}
          </CardTitle>
          <CardDescription>
            Datas interpretadas em UTC, inclusive datas passadas. Este lançamento não
            muda o plano da empresa. Vendas não podem ser editadas; correções exigem
            exclusão definitiva e novo lançamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            noValidate
            aria-label="Lançar venda manual"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FieldSet disabled={busy}>
              <FieldGroup className="grid gap-5 md:grid-cols-2">
                <Controller
                  control={control}
                  name="pricingMode"
                  render={({ field }) => (
                    <Field data-invalid={!!errors.pricingMode}>
                      <FieldLabel htmlFor="sale-pricing-mode">
                        Origem do valor
                      </FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="sale-pricing-mode"
                          aria-label="Origem do valor"
                          className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
                        >
                          <SelectValue>{PRICING_MODE_LABELS[field.value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent container={portal} alignItemWithTrigger={false}>
                          <SelectItem value="company_plan" disabled={!planEligible}>
                            Plano atual da empresa
                          </SelectItem>
                          <SelectItem value="manual_amount">
                            Valor manual com motivo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.pricingMode]} />
                    </Field>
                  )}
                />

                <Field data-invalid={!!errors.soldAt}>
                  <FieldLabel htmlFor="sale-sold-at">Data comercial (UTC)</FieldLabel>
                  <Input
                    id="sale-sold-at"
                    type="datetime-local"
                    aria-invalid={!!errors.soldAt}
                    className="h-10"
                    {...register('soldAt')}
                  />
                  <FieldError errors={[errors.soldAt]} />
                </Field>

                {pricingMode === 'company_plan' ? (
                  <div className="rounded-xl border bg-muted/30 p-4 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm font-semibold">
                        {plan?.name || 'Sem plano comercial ativo'}
                      </strong>
                      <span className="text-sm font-semibold">{plan?.price} BRL</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      O backend usará o preço vigente do plano ao confirmar. Não é uma
                      cobrança.
                    </p>
                  </div>
                ) : (
                  <Field data-invalid={!!errors.amount}>
                    <FieldLabel htmlFor="sale-manual-amount">Valor em reais</FieldLabel>
                    <Input
                      id="sale-manual-amount"
                      inputMode="decimal"
                      placeholder="59.90"
                      aria-invalid={!!errors.amount}
                      className="h-10"
                      {...register('amount')}
                    />
                    <FieldDescription>
                      Informe um valor positivo (ex.: 120.50).
                    </FieldDescription>
                    <FieldError errors={[errors.amount]} />
                  </Field>
                )}

                <Field className="md:col-span-2" data-invalid={!!errors.description}>
                  <FieldLabel htmlFor="sale-description">
                    Descrição / motivo
                    {pricingMode === 'manual_amount' ? ' (obrigatório)' : ' (opcional)'}
                  </FieldLabel>
                  <Textarea
                    id="sale-description"
                    maxLength={3000}
                    rows={3}
                    aria-invalid={!!errors.description}
                    {...register('description')}
                  />
                  <FieldError errors={[errors.description]} />
                </Field>
              </FieldGroup>
            </FieldSet>

            <div className="flex items-center justify-end border-t pt-5">
              <Button
                type="submit"
                className="min-h-10 px-5"
                disabled={busy || (pricingMode === 'company_plan' && !planEligible)}
              >
                {busy ? 'Registrando…' : 'Registrar venda manual'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
