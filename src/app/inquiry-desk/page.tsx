import { redirect } from 'next/navigation';

export default function InquiryDeskPage() {
    redirect('/dashboard?view=inquiry');
}
