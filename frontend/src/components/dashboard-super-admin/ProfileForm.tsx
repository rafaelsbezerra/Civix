import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '../ui/field';
import { Input } from '../ui/input';

const profileFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.').max(120),
  email: z
    .string()
    .trim()
    .regex(/^\S+@\S+\.\S+$/, 'Informe um e-mail válido.')
    .max(254),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({
  name,
  email,
  busy,
  onSave,
}: {
  name?: string;
  email: string;
  busy: boolean;
  onSave: (input: { name: string; email: string }) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: name || '',
      email,
    },
  });

  useEffect(() => {
    reset({ name: name || '', email });
  }, [name, email, reset]);

  const onSubmit = (values: ProfileFormValues) => {
    onSave({
      name: values.name.trim(),
      email: values.email.trim(),
    });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b pb-5">
        <CardTitle className="text-base font-semibold">Informações pessoais</CardTitle>
        <CardDescription>
          Ao trocar o e-mail, será necessário entrar novamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          noValidate
          aria-label="Atualizar meu perfil"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FieldSet disabled={busy}>
            <FieldGroup className="grid gap-5">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
                <Input
                  id="profile-name"
                  autoComplete="name"
                  maxLength={120}
                  disabled={busy}
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                <Input
                  id="profile-email"
                  autoComplete="email"
                  type="email"
                  maxLength={254}
                  disabled={busy}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="flex items-center justify-end border-t pt-5">
            <Button type="submit" className="min-h-10 px-5" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar perfil'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
