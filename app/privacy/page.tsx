import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว — หรีดร่วมบุญ",
  description: "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของระบบหรีดร่วมบุญ",
};

const UPDATED = "30 มิถุนายน 2569";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-gold-800">{title}</h2>
      <div className="space-y-2 text-sm leading-7 text-gold-800/85">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream-50">
      <header className="sticky top-0 z-30 border-b border-gold-200 bg-cream-100/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700">
            <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
          </Link>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold gold-gradient-text">
            <LotusIcon className="h-5 w-5 text-gold-600" /> หรีดร่วมบุญ
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gold-900">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-xs text-gold-500">
            การคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) · ปรับปรุงล่าสุด {UPDATED}
          </p>
        </div>

        <p className="text-sm leading-7 text-gold-800/85">
          <strong>บริษัท หรีดร่วมบุญ จำกัด</strong> (“บริษัท” หรือ “เรา”) ผู้พัฒนาและให้บริการระบบ <strong>หรีดร่วมบุญ</strong>
          สำหรับจัดการงานฌาปนกิจแบบลดขยะและร่วมบุญผ่านเจ้าภาพโดยตรง เราเคารพความเป็นส่วนตัวของผู้ใช้
          และเก็บ/ใช้ข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อการให้บริการเท่านั้น
        </p>
        <p className="text-sm leading-7 text-gold-800/85">
          กรณีองค์กรปกครองส่วนท้องถิ่น (อปท.) หรือศูนย์บริหารงานใดเปิดใช้ระบบ ศูนย์นั้นจะร่วมเป็น
          <strong>ผู้ควบคุมข้อมูลส่วนบุคคลร่วม</strong> สำหรับข้อมูลของงานในพื้นที่ของตน เนื่องจากศูนย์เป็นผู้เก็บและใช้ข้อมูลในการดำเนินงานด้วย
        </p>

        <Section title="1. ข้อมูลที่เราเก็บรวบรวม">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>ผู้วายชนม์:</strong> ชื่อ-นามสกุล วันเกิด/วันเสียชีวิต อายุ รูปถ่าย</li>
            <li><strong>เจ้าภาพ:</strong> ชื่อ-นามสกุล เบอร์โทรศัพท์ ความสัมพันธ์ เลขบัญชี/พร้อมเพย์ และเอกสารยืนยัน (เช่น สำเนาบัตรประชาชน/ใบมรณบัตร) ถ้ามีการอัปโหลด</li>
            <li><strong>ผู้ร่วมบุญ:</strong> ชื่อที่ใช้บนป้าย ตำแหน่ง/คำนำหน้า จำนวนเงิน รูปสลิปการโอน ข้อความไว้อาลัย</li>
            <li><strong>ภาพที่ระลึก (AI):</strong> รูปใบหน้าที่ผู้ร่วมบุญแนบเข้ามาเพื่อสร้างภาพจำลองมอบหรีด (ใช้เมื่อผู้ใช้ยินยอมเท่านั้น)</li>
            <li><strong>ข้อมูลการใช้งานทางเทคนิค:</strong> เวลาเข้าใช้ และข้อมูลที่จำเป็นต่อความปลอดภัยของระบบ</li>
          </ul>
        </Section>

        <Section title="2. วัตถุประสงค์ในการใช้ข้อมูล">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>จัดการงานฌาปนกิจ แสดงข้อมูลงาน และพิมพ์ป้ายชื่อผู้ร่วมบุญ</li>
            <li>สร้าง QR/แสดงเลขบัญชีเพื่อให้ผู้ร่วมบุญโอนเงินเข้าบัญชีเจ้าภาพโดยตรง</li>
            <li>ยืนยันตัวตนเจ้าภาพด้วยรหัส OTP เพื่อความถูกต้องของบัญชีรับเงิน</li>
            <li>สร้างภาพที่ระลึก (AI) ตามที่ผู้ใช้ยินยอม</li>
            <li>จัดทำรายงานสรุปต่อองค์กรปกครองส่วนท้องถิ่น (อปท.) <strong>ในรูปแบบยอดรวม/สถิติที่ไม่มีข้อมูลส่วนบุคคล</strong></li>
          </ul>
        </Section>

        <Section title="3. การเปิดเผยข้อมูลแก่บุคคลภายนอก">
          <p>เราไม่ขายข้อมูลส่วนบุคคล และเปิดเผยเท่าที่จำเป็นต่อการให้บริการเท่านั้น ได้แก่:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>ศูนย์บริหารงาน:</strong> เห็นข้อมูลงานของศูนย์ตนเองเพื่อดำเนินงาน</li>
            <li><strong>อปท. (ผู้กำกับดูแล):</strong> เห็นเฉพาะภาพรวม/สถิติ <strong>ไม่เห็นข้อมูลส่วนบุคคล</strong> (ชื่อผู้ร่วมบุญ บัญชี เอกสาร)</li>
            <li><strong>ผู้ให้บริการประมวลผล:</strong> ระบบจัดเก็บข้อมูล (Supabase), บริการสร้างภาพ AI (OpenAI) เฉพาะรูปที่ผู้ใช้ยินยอม, บริการส่ง SMS OTP และบริการพิมพ์ป้าย — ภายใต้ข้อตกลงการรักษาความลับ</li>
          </ul>
        </Section>

        <Section title="4. ระยะเวลาการเก็บรักษา">
          <p>
            เราเก็บข้อมูลเท่าที่จำเป็นต่อวัตถุประสงค์ข้างต้นและตามที่กฎหมายกำหนด เมื่อหมดความจำเป็นจะลบหรือทำให้ไม่สามารถระบุตัวบุคคลได้
            รูปสลิปและเอกสารยืนยันถูกจัดเก็บแบบจำกัดการเข้าถึง (private)
          </p>
        </Section>

        <Section title="5. สิทธิของเจ้าของข้อมูล (ตาม PDPA)">
          <p>ท่านมีสิทธิดังนี้: ขอเข้าถึง/ขอสำเนา, ขอแก้ไขให้ถูกต้อง, ขอลบ, ขอคัดค้าน/ระงับการใช้, ขอถอนความยินยอม และขอให้โอนย้ายข้อมูล</p>
          <p>การถอนความยินยอมไม่กระทบการประมวลผลที่ทำไปแล้วโดยชอบด้วยกฎหมาย</p>
        </Section>

        <Section title="6. ความปลอดภัยของข้อมูล">
          <p>
            เรามีมาตรการป้องกันตามสมควร เช่น การจำกัดสิทธิ์การเข้าถึงตามบทบาท การยืนยันเบอร์ด้วย OTP ก่อนแก้ไขบัญชีรับเงิน
            และการจัดเก็บไฟล์อ่อนไหวแบบ private
          </p>
        </Section>

        <Section title="7. ติดต่อเรา">
          <p>หากต้องการใช้สิทธิหรือสอบถามเกี่ยวกับข้อมูลส่วนบุคคล โปรดติดต่อผู้ควบคุมข้อมูลส่วนบุคคล:</p>
          <div className="rounded-xl border border-gold-200 bg-white px-4 py-3 text-sm leading-7 text-gold-800/90">
            <p><strong>บริษัท หรีดร่วมบุญ จำกัด</strong></p>
            <p>อีเมล: <a href="mailto:rrbzerowaste@gmail.com" className="text-gold-700 underline underline-offset-2">rrbzerowaste@gmail.com</a></p>
            <p>โทร: <a href="tel:0962354999" className="text-gold-700 underline underline-offset-2">096-235-4999</a></p>
          </div>
          <p className="text-xs text-gold-500">
            กรณีข้อมูลของงานในพื้นที่ใดพื้นที่หนึ่ง ท่านสามารถติดต่อศูนย์บริหารงาน/อปท. ที่ดูแลงานนั้นได้โดยตรงอีกช่องทางหนึ่ง
          </p>
        </Section>
      </div>

      <SiteFooter />
    </main>
  );
}
