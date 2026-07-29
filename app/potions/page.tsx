import { getAllIngredients, getPlayablePotions } from "@/modules/potions";
import { PotionGame } from "./potion-game";

export const revalidate = 86400;

export default async function PotionsPage() {
  const [potions, ingredients] = await Promise.all([
    getPlayablePotions(),
    getAllIngredients(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
        III. The Brewing
      </p>

      <h1 className="mt-6 font-display text-display font-semibold leading-[1.1] text-steel">
        Brew a Potion.
      </h1>

      <p className="mt-6 max-w-2xl font-body text-body-lg text-moonlight">
        A half-finished recipe sits on your desk. Choose the right ingredient
        from each set before the cauldron spoils — one mistake ends the brew.
      </p>

      {potions.length === 0 ? (
        <p className="mt-16 font-body text-body text-whisper">
          The storeroom is empty. Try again later.
        </p>
      ) : (
        <PotionGame potions={potions} ingredients={ingredients} />
      )}
    </main>
  );
}
