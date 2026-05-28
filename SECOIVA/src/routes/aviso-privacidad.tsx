import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/site/LegalLayout";

export const Route = createFileRoute("/aviso-privacidad")({
  head: () => ({
    meta: [
      { title: "Aviso de Privacidad — SECOIVSA" },
      { name: "description", content: "Protección y tratamiento responsable de la información corporativa y operativa en el ecosistema digital SECOIVSA." },
      { property: "og:title", content: "Aviso de Privacidad — SECOIVSA" },
      { property: "og:description", content: "Protección y tratamiento responsable de la información corporativa y operativa." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalLayout
      eyebrow="Privacidad"
      title="Aviso de Privacidad"
      subtitle="Protección y tratamiento responsable de la información corporativa y operativa."
      updated="27 de mayo de 2026"
    >
      <p>
        <strong>Servicios y Construcciones Industriales de Victoria</strong>, conocido comercialmente como SECOIVSA,
        con domicilio en 6 de Abril 309, 89603 La Pedrera, Tamaulipas, México, es responsable del tratamiento,
        uso y protección de los datos personales proporcionados a través de sus plataformas digitales, formularios
        operativos, ecosistemas de contacto y módulos vinculados al Centro de Operación Digital (COD).
      </p>
      <p>
        SECOIVSA reconoce la importancia de la privacidad, seguridad digital y confidencialidad de la información
        de clientes, proveedores, colaboradores, candidatos y usuarios que interactúan con la organización.
      </p>

      <h2>Finalidad del tratamiento de datos</h2>
      <p>La información recopilada podrá utilizarse para:</p>
      <ul>
        <li>Atención comercial y corporativa.</li>
        <li>Seguimiento de proyectos.</li>
        <li>Procesos de cotización.</li>
        <li>Administración operativa.</li>
        <li>Atención a clientes y proveedores.</li>
        <li>Reclutamiento y recursos humanos.</li>
        <li>Integración documental.</li>
        <li>Control administrativo.</li>
        <li>Acceso a plataformas digitales.</li>
        <li>Validación de identidad.</li>
        <li>Cumplimiento legal y contractual.</li>
        <li>Mejora de la experiencia operativa digital.</li>
      </ul>

      <h2>Datos recopilados</h2>
      <p>SECOIVSA podrá recopilar:</p>
      <ul>
        <li>Nombre completo.</li>
        <li>Empresa o razón social.</li>
        <li>Correo electrónico.</li>
        <li>Teléfono.</li>
        <li>Documentación enviada voluntariamente.</li>
        <li>Información operativa o comercial.</li>
        <li>Datos proporcionados en formularios.</li>
        <li>Registros digitales de interacción.</li>
      </ul>

      <h2>Protección de información</h2>
      <p>SECOIVSA implementa medidas administrativas, digitales, técnicas y operativas orientadas a proteger la integridad, confidencialidad y disponibilidad de la información.</p>
      <p>La empresa promueve procesos internos de control documental, trazabilidad digital y administración responsable de datos.</p>

      <h2>Derechos ARCO</h2>
      <p>Los titulares podrán solicitar:</p>
      <ul>
        <li>Acceso.</li>
        <li>Rectificación.</li>
        <li>Cancelación.</li>
        <li>Oposición.</li>
      </ul>
      <p>Respecto al tratamiento de sus datos personales. Las solicitudes deberán enviarse al correo <a href="mailto:contacto@secoivsa.com">contacto@secoivsa.com</a>.</p>

      <h2>Cookies y tecnologías digitales</h2>
      <p>El sitio web y plataformas asociadas podrán utilizar cookies, herramientas analíticas y tecnologías digitales para optimizar:</p>
      <ul>
        <li>Navegación.</li>
        <li>Experiencia de usuario.</li>
        <li>Rendimiento operativo.</li>
        <li>Seguridad digital.</li>
        <li>Funcionamiento del ecosistema COD.</li>
      </ul>

      <h2>Modificaciones</h2>
      <p>SECOIVSA podrá actualizar el presente aviso para reflejar:</p>
      <ul>
        <li>Cambios normativos.</li>
        <li>Mejoras operativas.</li>
        <li>Evolución tecnológica.</li>
        <li>Actualización de procesos digitales.</li>
      </ul>
    </LegalLayout>
  );
}
