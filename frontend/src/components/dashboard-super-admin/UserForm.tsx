import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ManagedUser, ManagedUserInput } from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '../ui/field';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const ROLE_LABELS: Record<'admin_empresa' | 'atendente', string> = {
  atendente: 'Atendente',
  admin_empresa: 'Admin da empresa',
};

const userFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do usuário.').max(120),
  email: z
    .string()
    .trim()
    .regex(/^\S+@\S+\.\S+$/, 'Informe um e-mail válido.')
    .max(254),
  role: z.enum(['admin_empresa', 'atendente']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function UserForm({
  user,
  global,
  busy,
  onSave,
  onCancel,
}: {
  user?: ManagedUser;
  global: boolean;
  busy: boolean;
  onSave: (input: ManagedUserInput) => void;
  onCancel: () => void;
}) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role === 'admin_empresa' ? 'admin_empresa' : 'atendente',
    },
  });

  useEffect(() => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role === 'admin_empresa' ? 'admin_empresa' : 'atendente',
    });
  }, [user, reset]);

  const onSubmit = (values: UserFormValues) => {
    onSave({
      name: values.name.trim(),
      email: values.email.trim(),
      ...(global ? {} : { role: values.role }),
    });
  };

  return (
    <div ref={setPortal}>
      <Card className="rounded-2xl">
        <CardHeader className="border-b pb-5">
          <CardTitle className="text-base font-semibold">
            {user ? 'Editar usuário' : 'Novo convite'}
          </CardTitle>
          <CardDescription>
            {user
              ? 'Alterar e-mail ou perfil revoga as sessões anteriores. Convites pendentes precisam ser reenviados se esses dados mudarem.'
              : 'Um convite será enviado para definir a senha. A conta não recebe uma senha pronta.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            aria-label={user ? 'Editar usuário' : 'Convidar usuário'}
            className="space-y-6"
          >
            <FieldSet disabled={busy}>
              <FieldGroup className="grid gap-5 md:grid-cols-2">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="managed-user-name">Nome</FieldLabel>
                  <Input
                    id="managed-user-name"
                    maxLength={120}
                    disabled={busy}
                    aria-invalid={!!errors.name}
                    {...register('name')}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="managed-user-email">E-mail</FieldLabel>
                  <Input
                    id="managed-user-email"
                    type="email"
                    maxLength={254}
                    disabled={busy}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>

                {global ? (
                  <p className="text-xs text-muted-foreground md:col-span-2">
                    Superadmin: todos possuem os mesmos poderes na plataforma.
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Field data-invalid={!!errors.role}>
                        <FieldLabel htmlFor="managed-user-role">Perfil</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={busy}
                        >
                          <SelectTrigger
                            id="managed-user-role"
                            aria-label="Perfil"
                            className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
                          >
                            <SelectValue>{ROLE_LABELS[field.value]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            container={portal}
                            alignItemWithTrigger={false}
                          >
                            <SelectItem value="atendente">Atendente</SelectItem>
                            <SelectItem value="admin_empresa">
                              Admin da empresa
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError errors={[errors.role]} />
                      </Field>
                    )}
                  />
                )}
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
                {busy ? 'Salvando…' : user ? 'Salvar usuário' : 'Enviar convite'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
