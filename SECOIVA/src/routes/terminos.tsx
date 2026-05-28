import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/site/LegalLayout";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — SECOIVSA" },
      { name: "description", content: "Lineamientos de acceso y uso del ecosistema digital SECOIVSA." },
      { property: "og:title", content: "Términos y Condiciones — SECOIVSA" },
      { property: "og:description", content: "Lineamientos de acceso y uso del ecosistema digital SECOIVSA." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalLayout
      eyebrow="Términos"
      title="Términos y Condiciones"
      subtitle="Lineamientos de acceso y uso del ecosistema digital SECOIVSA."
      updated="27 de mayo de 2026"
    >
      <h2>Aceptación de uso</h2>
      <p>
        El acceso, navegación y utilización del sitio web SECOIVSA implica la aceptación
        de los presentes términos y condiciones.
      </p>
      <p>
        El usuario reconoce que el sitio forma parte del ecosistema corporativo y operativo
        de <strong>Servicios y Construcciones Industriales de Victoria</strong>.
      </p>

      <h2>Objetivo del sitio</h2>
      <p>La plataforma digital SECOIVSA tiene como finalidad:</p>
      <ul>
        <li>Presentar información corporativa.</li>
        <li>Mostrar capacidades operativas.</li>
        <li>Facilitar contacto empresarial.</li>
        <li>Integrar accesos operativos.</li>
        <li>Conectar módulos digitales.</li>
        <li>Habilitar interacción con clientes, proveedores y candidatos.</li>
        <li>Fortalecer el ecosistema COD.</li>
      </ul>

      <h2>Uso adecuado</h2>
      <p>Los usuarios se comprometen a utilizar el sitio y sus plataformas asociadas de forma:</p>
      <ul>
        <li>Lícita.</li>
        <li>Responsable.</li>
        <li>Respetuosa.</li>
        <li>Segura.</li>
      </ul>
      <p>Queda prohibido:</p>
      <ul>
        <li>Alterar sistemas.</li>
        <li>Vulnerar la seguridad digital.</li>
        <li>Reproducir contenido sin autorización.</li>
        <li>Utilizar información con fines ilícitos.</li>
      </ul>

      <h2>Propiedad intelectual</h2>
      <p>Todo contenido presente en el sitio, incluyendo:</p>
      <ul>
        <li>Logotipos.</li>
        <li>Diseño visual.</li>
        <li>Estructura digital.</li>
        <li>Imágenes.</li>
        <li>Contenido gráfico.</li>
        <li>Elementos audiovisuales.</li>
        <li>Identidad corporativa.</li>
        <li>Arquitectura visual.</li>
        <li>Contenido operativo.</li>
      </ul>
      <p>Pertenece a SECOIVSA y se encuentra protegido por la legislación aplicable.</p>

      <h2>Plataformas y accesos operativos</h2>
      <p>El sitio podrá integrar accesos relacionados con:</p>
      <ul>
        <li>Portal Clientes.</li>
        <li>Portal de Proveedores.</li>
        <li>Bolsa de Trabajo.</li>
        <li>Centro de Operación Digital (COD).</li>
      </ul>
      <p>Los accesos podrán evolucionar conforme al crecimiento operativo y tecnológico de la organización.</p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        SECOIVSA no garantiza disponibilidad ininterrumpida de plataformas digitales,
        ni será responsable por afectaciones derivadas de:
      </p>
      <ul>
        <li>Fallas técnicas.</li>
        <li>Interrupciones externas.</li>
        <li>Mantenimiento.</li>
        <li>Uso indebido de la plataforma.</li>
      </ul>

      <h2>Actualizaciones</h2>
      <p>SECOIVSA podrá:</p>
      <ul>
        <li>Modificar contenido.</li>
        <li>Actualizar estructura.</li>
        <li>Integrar nuevos módulos.</li>
        <li>Optimizar plataformas digitales.</li>
      </ul>
      <p>Sin previo aviso.</p>
    </LegalLayout>
  );
}
