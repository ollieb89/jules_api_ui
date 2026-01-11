import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design System/Colors',
};

export default meta;

type Story = StoryObj;

const renderSection = (title: string, tokens: string[]): string => {
  const swatches = tokens
    .map(
      (token) => `
        <div class="rounded-lg border border-[var(--color-border-default)] overflow-hidden">
          <div class="h-16" style="background: var(${token})"></div>
          <div class="p-3 text-xs">
            <div class="font-semibold">${token.replace('--color-', '')}</div>
            <div class="text-[var(--color-text-tertiary)]">${token}</div>
          </div>
        </div>
      `,
    )
    .join('');

  return `
    <section class="mb-10">
      <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">${title}</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">${swatches}</div>
    </section>
  `;
};

export const ColorPalette: Story = {
  render: () => ({
    template: `
      <div class="p-8" style="background: var(--color-background-primary); color: var(--color-text-primary);">
        <h1 class="text-3xl font-bold mb-8">Jules API UI Color Palette</h1>
        ${renderSection('Primary Colors', [
          '--color-primary-50',
          '--color-primary-100',
          '--color-primary-200',
          '--color-primary-300',
          '--color-primary-400',
          '--color-primary-500',
          '--color-primary-600',
          '--color-primary-700',
          '--color-primary-800',
          '--color-primary-900',
        ])}
        ${renderSection('Secondary Colors', [
          '--color-secondary-50',
          '--color-secondary-100',
          '--color-secondary-200',
          '--color-secondary-300',
          '--color-secondary-400',
          '--color-secondary-500',
          '--color-secondary-600',
          '--color-secondary-700',
          '--color-secondary-800',
          '--color-secondary-900',
        ])}
        ${renderSection('Semantic Colors', [
          '--color-success-500',
          '--color-error-500',
          '--color-warning-500',
          '--color-info-500',
        ])}
        <section>
          <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Accessibility</h2>
          <p class="text-[var(--color-text-secondary)]">
            All semantic tokens are designed for WCAG 2.1 AA contrast ratios in both light and dark
            modes. Focus rings are always visible and meet the 3:1 contrast guidance.
          </p>
        </section>
      </div>
    `,
  }),
};
