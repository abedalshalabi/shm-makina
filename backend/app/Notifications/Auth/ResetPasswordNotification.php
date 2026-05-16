<?php

namespace App\Notifications\Auth;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use App\Support\AppUrl;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = AppUrl::frontend();
        $resetUrl = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('استعادة كلمة المرور')
            ->line('تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.')
            ->action('إعادة تعيين كلمة المرور', $resetUrl)
            ->line('إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.');
    }
}
