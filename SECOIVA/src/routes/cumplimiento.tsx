import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/site/LegalLayout";

export const Route = createFileRoute("/cumplimiento")({
  head: () => ({
    meta: [
      { title: "Cumplimiento Corporativo — SECOIVSA" },
      { name: "description", content: "Disciplina operativa, seguridad y evolución industrial estructurada de SECOIVSA." },
      { property: "og:title", content: "Cumplimiento Corporativo — SECOIVSA" },
      { property: "og:description", content: "Disciplina operativa, seguridad y evolución industrial estructurada." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalLayout
      eyebrow="Cumplimiento"
      title="Cumplimiento Corporativo"
      subtitle="Disciplina operativa, seguridad y evolución industrial estructurada."
      updated="27 de mayo de 2026"
    >
      <p>
        SECOIVSA mantiene un compromiso permanente con el desarrollo de operaciones industriales
        bajo principios de:
      </p>
      <ul>
        <li>Seguridad.</li>
        <li>Responsabilidad.</li>
        <li>Integridad.</li>
        <li>Disciplina operativa.</li>
        <li>Mejora continua.</li>
        <li>Cumplimiento corporativo.</li>
      </ul>
      <p>
        La organización promueve una cultura empresarial orientada a la excelencia técnica,
        la eficiencia operativa y la evolución tecnológica del sector industrial.
      </p>

      <h2>Enfoque operativo</h2>
      <p>SECOIVSA desarrolla sus actividades mediante procesos estructurados de:</p>
      <ul>
        <li>Construcción industrial.</li>
        <li>Mantenimiento.</li>
        <li>Montaje.</li>
        <li>Fabricación.</li>
        <li>Integración operativa.</li>
      </ul>
      <p>Aplicando controles internos orientados a:</p>
      <ul>
        <li>Trazabilidad.</li>
        <li>Calidad.</li>
        <li>Documentación.</li>
        <li>Seguridad.</li>
        <li>Control operativo.</li>
      </ul>

      <h2>Seguridad y calidad</h2>
      <p>La empresa impulsa prácticas responsables para proteger:</p>
      <ul>
        <li>Personal.</li>
        <li>Instalaciones.</li>
        <li>Clientes.</li>
        <li>Procesos.</li>
        <li>Entorno operativo.</li>
      </ul>
      <p>Promoviendo:</p>
      <ul>
        <li>Disciplina industrial.</li>
        <li>Prevención.</li>
        <li>Control documental.</li>
        <li>Cumplimiento operativo.</li>
      </ul>

      <h2>Transformación digital</h2>
      <p>
        Como parte de su evolución empresarial, SECOIVSA desarrolla el
        <strong> Centro de Operación Digital (COD)</strong>, una plataforma enfocada en:
      </p>
      <ul>
        <li>Monitoreo operativo.</li>
        <li>Trazabilidad documental.</li>
        <li>Integración de procesos.</li>
        <li>Gestión digital.</li>
        <li>Seguimiento operativo.</li>
        <li>Administración estructurada.</li>
      </ul>

      <h2>Mejora continua</h2>
      <p>SECOIVSA promueve una filosofía empresarial basada en:</p>
      <ul>
        <li>Aprendizaje constante.</li>
        <li>Innovación.</li>
        <li>Modernización operativa.</li>
        <li>Evolución tecnológica.</li>
        <li>Fortalecimiento organizacional.</li>
      </ul>

      <h2>Objetivo corporativo</h2>
      <p>Fortalecer una estructura industrial moderna, capaz de integrar:</p>
      <ul>
        <li>Infraestructura.</li>
        <li>Operación.</li>
        <li>Tecnología.</li>
        <li>Control operativo.</li>
        <li>Gestión empresarial.</li>
      </ul>
      <p>Bajo una visión corporativa sólida y orientada al crecimiento sostenible.</p>
    </LegalLayout>
  );
}
