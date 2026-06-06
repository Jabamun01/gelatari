import React, { useState } from 'react';
import { styled } from '@linaria/react';
import { Modal } from '../common/Modal';
import { PrimaryButton, SecondaryButton } from '../common/Button';
import { changePassword } from '../../api/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const Input = styled.input`
  width: 100%;
`;

const ErrorMessage = styled.div`
  padding: var(--space-sm) var(--space-md);
  background-color: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  color: var(--danger-color-dark);
  font-size: var(--font-size-sm);
  text-align: center;
`;

const SuccessMessage = styled.div`
  padding: var(--space-sm) var(--space-md);
  background-color: var(--success-color-light);
  border: 1px solid var(--success-color);
  border-radius: var(--border-radius);
  color: var(--success-color-dark);
  font-size: var(--font-size-sm);
  text-align: center;
`;

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les contrasenyes noves no coincideixen.');
      return;
    }

    if (newPassword.length < 4) {
      setError('La contrasenya nova ha de tenir almenys 4 caràcters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await changePassword(currentPassword, newPassword);
      setSuccess(result.message || 'Contrasenya canviada correctament.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en canviar la contrasenya.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Canviar Contrasenya"
      footer={
        <>
          <SecondaryButton onClick={handleClose} disabled={isSubmitting}>
            Cancel·lar
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="change-password-form"
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
          >
            {isSubmitting ? 'Desant...' : 'Desar'}
          </PrimaryButton>
        </>
      }
    >
      <Form id="change-password-form" onSubmit={handleSubmit}>
        {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
        {success && <SuccessMessage role="status">{success}</SuccessMessage>}

        <Input
          type="password"
          placeholder="Contrasenya actual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          type="password"
          placeholder="Contrasenya nova"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          type="password"
          placeholder="Confirma la contrasenya nova"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
