import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/site/LegalLayout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies — SECOIVSA" },
      { name: "description", content: "Optimización y funcionamiento del ecosistema digital SECOIVSA." },
      { property: "og:title", content: "Política de Cookies — SECOIVSA" },
      { property: "og:description", content: "Optimización y funcionamiento del ecosistema digital SECOIVSA." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalLayout
      eyebrow="Cookies"
      title="Política de Cookies"
      subtitle="Optimización y funcionamiento del ecosistema digital SECOIVSA."
      updated="27 de mayo de 2026"
    >
      <h2>Uso de cookies</h2>
      <p>
        SECOIVSA utiliza cookies y tecnologías digitales similares para optimizar:
      </p>
      <ul>
        <li>Funcionamiento del sitio.</li>
        <li>Experiencia de navegación.</li>
        <li>Rendimiento operativo.</li>
        <li>Interacción con plataformas digitales.</li>
      </ul>

      <h2>Finalidad</h2>
      <p>Las cookies permiten:</p>
      <ul>
        <li>Recordar preferencias.</li>
        <li>Analizar el comportamiento de navegación.</li>
        <li>Mejorar la experiencia del usuario.</li>
        <li>Optimizar accesos operativos.</li>
        <li>Fortalecer el rendimiento del ecosistema COD.</li>
        <li>Generar métricas de funcionamiento.</li>
      </ul>

      <h2>Tipos de cookies</h2>
      <p>La plataforma podrá utilizar:</p>
      <ul>
        <li>Cookies técnicas.</li>
        <li>Cookies funcionales.</li>
        <li>Cookies analíticas.</li>
        <li>Cookies de rendimiento.</li>
      </ul>

      <h2>Control del usuario</h2>
      <p>El usuario podrá:</p>
      <ul>
        <li>Modificar preferencias.</li>
        <li>Bloquear cookies.</li>
        <li>Eliminar registros.</li>
      </ul>
      <p>Desde la configuración de su navegador o dispositivo.</p>

      <h2>Aceptación</h2>
      <p>El uso continuo del sitio implica la aceptación de la presente política.</p>
    </LegalLayout>
  );
}
