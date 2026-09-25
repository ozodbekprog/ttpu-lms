import { Card, CardBody, CardHeader } from "@/components/ui";
import { HelpIcon } from "./icons";
import { HelpSection } from "./section";

export type BotCommand = {
  command: string;
  description: string;
  result: string;
};

export function BotCommands({ commands }: { commands: BotCommand[] }) {
  return (
    <HelpSection
      id="bot"
      icon="send"
      title="Telegram bot buyruqlari"
      description="Jadval va davomatni telefonda kuzatish uchun qisqa buyruqlar."
    >
      <Card className="overflow-hidden">
        <CardHeader
          title="Buyruqlar ro'yxati"
          subtitle="Botga ulangach quyidagi buyruqlar faollashadi"
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="px-6 py-3 font-semibold">Buyruq</th>
                  <th className="px-6 py-3 font-semibold">Tavsif</th>
                  <th className="hidden px-6 py-3 font-semibold md:table-cell">Natija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commands.map((item) => (
                  <tr key={item.command} className="group transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-3.5">
                      <code className="inline-block rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-100 group-hover:text-brand-800 group-hover:ring-brand-200">
                        {item.command}
                      </code>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{item.description}</td>
                    <td className="hidden px-6 py-3.5 md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <HelpIcon name="check" size={14} className="shrink-0 text-emerald-500" />
                        {item.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
        <HelpIcon name="help" size={16} className="mt-0.5 shrink-0" />
        <span>
          Avval botga <span className="font-semibold">/start</span> yuboring — shundan so&apos;ng
          qolgan buyruqlar ishlaydi. Buyruqdan keyin javob bir necha soniyada keladi.
        </span>
      </p>
    </HelpSection>
  );
}
