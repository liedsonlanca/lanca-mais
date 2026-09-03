import QRCode from "qrcode";
import { segredoTotp } from "@/lib/admin";
import { gerarSegredo, uriDeConfiguracao } from "@/lib/totp";
import { siteConfig } from "@/lib/site-config";
import { sql } from "@/lib/db";
import {
  campo,
  rotulo,
  ajuda,
  botaoPrimario,
  botaoDiscreto,
  cartao,
} from "@/components/admin/estilos";
import { ativarDuasEtapas, desativarDuasEtapas } from "./acoes";

// Nunca em cache: mostra o estado atual da proteção, e um segredo novo a cada
// visita enquanto ela não estiver ativada.
export const dynamic = "force-dynamic";

export default async function AdminSeguranca() {
  const ativo = await segredoTotp();

  // Segredo proposto para esta visita. Só vira permanente depois que a pessoa
  // confirmar com um código do aplicativo.
  const proposto = ativo ? null : gerarSegredo();
  const uri = proposto
    ? uriDeConfiguracao(proposto, siteConfig.email, "LANCA+ Painel")
    : null;

  const qr = uri
    ? await QRCode.toDataURL(uri, { margin: 1, width: 220 })
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-semibold text-preto">
        Segurança
      </h1>
      <p className="mt-2 leading-relaxed text-preto/65">
        A senha protege o painel. A verificação em duas etapas acrescenta um
        código de seis dígitos, que muda a cada trinta segundos e só existe no
        seu celular — assim, uma senha descoberta não basta para entrar.
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. A verificação em duas etapas precisa
          dele para guardar a chave.
        </p>
      )}

      {ativo ? (
        <div className={`${cartao} mt-8`}>
          <p className="flex items-center gap-3 font-medium text-preto">
            <span
              aria-hidden
              className="flex h-6 w-6 items-center justify-center rounded-full bg-salmon text-xs text-preto"
            >
              ✓
            </span>
            Verificação em duas etapas ativa
          </p>

          <p className="mt-4 text-sm leading-relaxed text-preto/70">
            Ao entrar no painel, além da senha, será pedido o código do seu
            aplicativo autenticador.
          </p>

          <form action={desativarDuasEtapas} className="mt-6 border-t border-linha pt-6">
            <label htmlFor="codigo-desativar" className={rotulo}>
              Para desativar, digite o código atual
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="codigo-desativar"
                name="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className={`${campo} w-36 text-center tracking-[0.3em]`}
              />
              <button type="submit" className={botaoDiscreto}>
                Desativar verificação
              </button>
            </div>
            <p className={ajuda}>
              O código é exigido também aqui: quem encontrar uma sessão aberta
              numa máquina esquecida não deve conseguir baixar a proteção.
            </p>
          </form>
        </div>
      ) : (
        <form action={ativarDuasEtapas} className={`${cartao} mt-8`}>
          <h2 className="font-medium text-preto">Ativar em três passos</h2>

          <ol className="mt-6 space-y-6">
            <li>
              <p className="text-sm font-medium text-preto">
                1. Instale um aplicativo autenticador
              </p>
              <p className={ajuda}>
                Google Authenticator, Microsoft Authenticator ou o próprio
                gerenciador de senhas do iPhone servem. Qualquer um funciona.
              </p>
            </li>

            <li>
              <p className="text-sm font-medium text-preto">
                2. Escaneie este código
              </p>

              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt="Código QR para configurar a verificação em duas etapas"
                  width={220}
                  height={220}
                  className="mt-3 rounded-xl border border-linha bg-branco p-2"
                />
              )}

              <p className={ajuda}>
                Sem câmera? Digite esta chave no aplicativo:
              </p>
              <code className="mt-2 block break-all rounded-xl border border-linha bg-areia px-4 py-3 font-mono text-sm text-preto">
                {proposto}
              </code>
            </li>

            <li>
              <p className="text-sm font-medium text-preto">
                3. Confirme com o código que apareceu
              </p>
              <input type="hidden" name="segredo" value={proposto ?? ""} />
              <input
                name="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="000000"
                className={`${campo} mt-3 w-36 text-center tracking-[0.3em]`}
              />
              <p className={ajuda}>
                A confirmação existe para não trancar você para fora: sem ela,
                um erro ao escanear faria o painel exigir um código que o seu
                aplicativo não sabe gerar.
              </p>
            </li>
          </ol>

          <button type="submit" className={`${botaoPrimario} mt-8`}>
            Ativar verificação em duas etapas
          </button>

          <p className="mt-6 rounded-2xl border border-linha bg-areia p-4 text-xs leading-relaxed text-preto/70">
            <strong className="font-medium text-preto">Antes de ativar:</strong>{" "}
            guarde a chave acima num lugar seguro, fora do celular. Se você
            perder o aparelho sem ela, a única saída é apagar a chave direto no
            banco de dados.
          </p>
        </form>
      )}
    </div>
  );
}
