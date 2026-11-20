import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import AttendanceDemoPage from './AttendanceDemoPage';

function renderAttendanceDemo() {
  return render(
    <MemoryRouter>
      <AttendanceDemoPage />
    </MemoryRouter>,
  );
}

describe('AttendanceDemoPage', () => {
  it('renders six fictional conversations and status filters', () => {
    renderAttendanceDemo();

    const list = screen.getByRole('region', { name: 'Lista de conversas' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Todas6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pendentes3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Em atendimento2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizadas1' })).toBeInTheDocument();
    expect(screen.getByText(/ambiente demonstrativo/i)).toBeInTheDocument();
  });

  it('searches by customer and filters conversations by status', async () => {
    const user = userEvent.setup();
    renderAttendanceDemo();

    await user.type(
      screen.getByRole('searchbox', { name: 'Pesquisar clientes' }),
      'Lucas',
    );
    expect(
      screen.getByRole('button', { name: 'Lucas Ferreira, Em atendimento' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Mariana Costa/ }),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Pesquisar clientes' }));
    await user.click(screen.getByRole('button', { name: 'Pendentes3' }));

    const list = screen.getByRole('region', { name: 'Lista de conversas' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: /Lucas Ferreira/ }),
    ).not.toBeInTheDocument();
  });

  it('assigns a conversation to the attendant and sends a local reply with Enter', async () => {
    const user = userEvent.setup();
    renderAttendanceDemo();

    await user.click(
      screen.getByRole('button', {
        name: 'Mariana Costa, Aguardando, 2 mensagens não lidas',
      }),
    );
    await user.click(screen.getAllByRole('button', { name: 'Assumir atendimento' })[0]);
    expect(screen.getAllByText(/Conversa assumida por Bia/)).toHaveLength(2);
    expect(screen.getByText('Com a atendente Bia')).toBeInTheDocument();

    const composer = screen.getByRole('textbox', { name: 'Digite uma mensagem' });
    await user.type(composer, 'Vou verificar as opções para você.{enter}');

    expect(screen.getByText('Vou verificar as opções para você.')).toBeInTheDocument();
    expect(screen.getByText('Bia · Atendente')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Devolver ao bot' })).toHaveLength(2);
  });

  it('returns a conversation to the bot, finalizes it, and allows reopening', async () => {
    const user = userEvent.setup();
    renderAttendanceDemo();

    await user.click(screen.getAllByRole('button', { name: 'Assumir atendimento' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Devolver ao bot' })[0]);
    expect(screen.getAllByText(/Conversa devolvida ao assistente Civix/)).toHaveLength(
      2,
    );
    expect(screen.getByText('Com o assistente Civix')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finalizar atendimento' }));
    expect(screen.getByText(/Atendimento finalizado\. Reabra/)).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Digite uma mensagem' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reabrir' }));
    expect(
      screen.getByRole('textbox', { name: 'Digite uma mensagem' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Atendimento reaberto e devolvido ao assistente Civix/),
    ).toHaveLength(2);
  });
});
