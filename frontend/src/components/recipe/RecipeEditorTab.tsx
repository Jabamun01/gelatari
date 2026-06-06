import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { styled } from '@linaria/react';
import { PrimaryButton, SecondaryButton, TextButton } from '../common/Button';
import Papa from 'papaparse';
import { fetchRecipeById, fetchRecipes, RecipeSearchResult, createRecipe, updateRecipe } from '../../api/recipes';
import { getAllIngredients } from '../../api/ingredients';
import { fetchDefaultSteps } from '../../api/defaultSteps';
import { RecipeDetails, RecipeIngredient, LinkedRecipeInfo, CreateRecipeDto, UpdateRecipeDto } from '../../types/recipe';
import { Ingredient } from '../../types/ingredient';
import { SearchableSelector, SelectableItem } from '../common/SearchableSelector';
import { ResolveUnmatchedIngredientModal } from './ResolveUnmatchedIngredientModal';
import { FormGroup, FormLabel, FormInput, FormSelect } from './RecipeEditorFormStyles';

interface ParsedCsvIngredient {
  name: string;
  amountGrams: number;
  originalRow: number;
}

interface UnmatchedIngredient extends ParsedCsvIngredient {
  reason: string;
}

interface RecipeEditorTabProps {
  recipeId?: string;
  tabId: string;
  onClose: () => void;
  onOpenRecipeTab: (recipeId: string, recipeName: string) => void;
}

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  max-width: 900px;
  margin: var(--space-lg) auto;
  overflow-x: hidden;

  @media (max-width: 640px) {
    margin: var(--space-md) auto;
    gap: var(--space-xl);
    padding: 0 var(--space-sm);
  }
`;

const SectionHeading = styled.h3`
  margin: 0 0 var(--space-lg) 0;
  color: var(--text-color-strong);
  border-top: var(--border-width) solid var(--border-color-light);
  padding-top: var(--space-xl);
  font-size: var(--font-size-lg);

  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
`;


const ButtonContainer = styled.div`
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: var(--border-width) solid var(--border-color-light);
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    button {
      flex: 1;
    }
  }
`;

const ComponentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-lg) 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
`;

const ComponentListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--surface-color-light);
  }

  @media (max-width: 640px) {
    padding: var(--space-sm) var(--space-md);
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);

    button {
      align-self: flex-end;
    }
  }
`;

const ComponentName = styled.span`
  font-weight: 500;
  margin-right: var(--space-sm);
  font-size: var(--font-size-sm);
`;

const ComponentAmount = styled.span`
  color: var(--text-color-light);
  margin-left: var(--space-sm);
  font-size: var(--font-size-xs);
  white-space: nowrap;
`;

const YieldDisplay = styled.p`
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--primary-color);
  margin: var(--space-sm) 0;
`;

const AddComponentForm = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius-lg);
  background-color: var(--surface-color-light);

  @media (max-width: 640px) {
    padding: var(--space-md);
  }
`;

const StepList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-lg) 0;
  counter-reset: editor-step-counter;
`;

const StepListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: var(--border-width) solid var(--border-color-light);
  position: relative;
  padding-left: var(--space-2xl);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  &::before {
    counter-increment: editor-step-counter;
    content: counter(editor-step-counter) '.';
    position: absolute;
    left: 0;
    top: var(--space-md);
    font-weight: 600;
    color: var(--text-color-light);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: var(--space-sm);

    button {
      align-self: flex-end;
    }
  }
`;

const StepTextArea = styled.textarea`
  flex-grow: 1;
  min-height: 80px;
  resize: vertical;
`;

const StepButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  align-items: center;

  @media (max-width: 640px) {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
`;

const EmptyState = styled(ComponentListItem)`
  justify-content: center;
  color: var(--text-color-light);
  font-style: italic;
  font-size: var(--font-size-sm);
`;

const FileInputRow = styled.div`
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;

    button {
      width: 100%;
    }
  }
`;

const FileInfo = styled.p`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin: var(--space-xs) 0 0 0;
`;

const UnmatchedNotice = styled.div`
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  border: 1px solid var(--warning-color);
  border-radius: var(--border-radius);
  background-color: var(--warning-color-light);
`;

const UnmatchedTitle = styled.h4`
  margin: 0 0 var(--space-sm) 0;
  color: var(--warning-color-dark);
`;

const UnmatchedText = styled.p`
  margin: 0 0 var(--space-md) 0;
  font-size: var(--font-size-sm);
  color: var(--text-color);
`;

const initialRecipeState: Omit<RecipeDetails, '_id' | 'baseYieldGrams'> = {
  name: '',
  type: 'ice cream recipe',
  category: 'ice cream',
  ingredients: [],
  steps: [],
  linkedRecipes: [],
};

export const RecipeEditorTab = ({ recipeId, onClose, onOpenRecipeTab }: RecipeEditorTabProps) => {
  const isEditing = !!recipeId;
  const queryClient = useQueryClient();

  const [recipeData, setRecipeData] = useState<Omit<RecipeDetails, '_id' | 'baseYieldGrams'>>(initialRecipeState);
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const [unmatchedIngredients, setUnmatchedIngredients] = useState<UnmatchedIngredient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingIngredientIndex, setResolvingIngredientIndex] = useState<number | null>(null);

  const { data: existingRecipe, isLoading: isLoadingExisting, isError, error } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => fetchRecipeById(recipeId!),
    enabled: isEditing,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isEditing && existingRecipe) {
      const { _id, baseYieldGrams, ...restOfRecipe } = existingRecipe;
      setRecipeData({
        ...initialRecipeState,
        ...restOfRecipe,
        category: existingRecipe.type === 'ice cream recipe'
          ? (existingRecipe.category ?? 'ice cream')
          : undefined,
        ingredients: existingRecipe.ingredients ?? [],
        steps: existingRecipe.steps ?? [],
        linkedRecipes: existingRecipe.linkedRecipes ?? [],
      });
    } else {
      setRecipeData(initialRecipeState);
      setSelectedCsvFile(null);
      setUnmatchedIngredients([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isEditing, existingRecipe, recipeId]);

  const minSearchLength = 2;
  const componentQueryKeyBase = ['componentSearch', recipeId];
  const ingredientsForFormQueryKeyBase = ['ingredientsForFormSearch', recipeId];

  const fetchIngredientsForForm = useCallback(async (term: string): Promise<SelectableItem[]> => {
    if (term.length < minSearchLength) return [];
    try {
      const ingredientsResponse = await getAllIngredients(1, 20, term);
      return ingredientsResponse.data.map((ing: Ingredient): SelectableItem => ({
        id: `ing_${ing._id}`,
        name: ing.name,
        type: 'ingredient',
      }));
    } catch {
      return [];
    }
  }, []);

  const fetchLinkedRecipeCandidates = useCallback(async (term: string): Promise<SelectableItem[]> => {
    if (term.length < minSearchLength) return [];
    try {
      const recipesApiResponse = await fetchRecipes(1, 20, term);
      return recipesApiResponse.recipes
        .filter((rec: RecipeSearchResult) => rec._id !== recipeId)
        .map((rec: RecipeSearchResult): SelectableItem => ({
          id: `rec_${rec._id}`,
          name: rec.name,
          type: 'recipe',
        }));
    } catch {
      return [];
    }
  }, [recipeId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === 'baseYieldGrams') return;

    setRecipeData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && value !== 'ice cream recipe' && { category: undefined }),
      ...(name === 'type' && value === 'ice cream recipe' && !prev.category && { category: 'ice cream' }),
    }));
  };

  const handleAddIngredientFromSelector = (item: SelectableItem, quantity: number) => {
    if (item.type !== 'ingredient') return;
    const ingredientId = item.id.startsWith('ing_') ? item.id.substring(4) : item.id;
    const ingredientName = item.name;

    if (recipeData.ingredients?.some((ingItem) => ingItem.ingredient._id === ingredientId)) {
      alert(`${ingredientName} ja és a la recepta.`);
      return;
    }
    const newRecipeIngredient: RecipeIngredient = {
      ingredient: { _id: ingredientId, name: ingredientName },
      amountGrams: quantity,
    };
    setRecipeData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newRecipeIngredient],
    }));
  };

  const handleAddLinkedRecipe = (item: SelectableItem, amountGrams: number) => {
    const { id: prefixedId, name, type } = item;
    if (type !== 'recipe') return;
    const id = prefixedId.substring(4);

    if (recipeData.linkedRecipes?.some((recItem) => recItem.recipe._id === id)) {
      alert(`${name} ja està vinculada a la recepta.`);
      return;
    }
    const newLinkedRecipe: LinkedRecipeInfo = {
      recipe: { _id: id, name: name },
      amountGrams: amountGrams,
    };
    setRecipeData((prev) => ({
      ...prev,
      linkedRecipes: [...(prev.linkedRecipes || []), newLinkedRecipe],
    }));
  };

  const handleRemoveRecipeComponent = (componentIdToRemove: string, componentType: 'ingredient' | 'recipe') => {
    if (componentType === 'ingredient') {
      setRecipeData((prev) => ({
        ...prev,
        ingredients: prev.ingredients?.filter((item) => item.ingredient._id !== componentIdToRemove) || [],
      }));
    } else if (componentType === 'recipe') {
      setRecipeData((prev) => ({
        ...prev,
        linkedRecipes: prev.linkedRecipes?.filter((item) => item.recipe._id !== componentIdToRemove) || [],
      }));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    setRecipeData((prev) => {
      const newSteps = [...(prev.steps || [])];
      newSteps[index] = value;
      return { ...prev, steps: newSteps };
    });
  };

  const handleAddStep = () => {
    setRecipeData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), ''],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setRecipeData((prev) => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAppendDefaultSteps = async (category: 'ice cream' | 'sorbet') => {
    try {
      const defaultSteps = await fetchDefaultSteps(category);
      setRecipeData((prev) => ({
        ...prev,
        steps: [...(prev.steps || []), ...defaultSteps],
      }));
    } catch (error) {
      console.error('Failed to fetch default steps:', error);
      alert('Error carregant els passos per defecte.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedCsvFile(event.target.files[0]);
      setUnmatchedIngredients([]);
    } else {
      setSelectedCsvFile(null);
    }
  };

  const handleImportCsv = async () => {
    if (!selectedCsvFile) {
      alert('Selecciona un fitxer CSV primer.');
      return;
    }

    setIsParsingCsv(true);
    setUnmatchedIngredients([]);

    let allDbIngredients: Ingredient[] = [];
    try {
      const response = await getAllIngredients(1, 1000);
      allDbIngredients = response.data;
    } catch {
      alert('Error obtenint ingredients de la base de dades.');
      setIsParsingCsv(false);
      return;
    }

    Papa.parse<string[]>(selectedCsvFile, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const ingredientsToAdd: RecipeIngredient[] = [];
        const unmatched: UnmatchedIngredient[] = [];

        for (let i = 1; i < results.data.length; i++) {
          const row = results.data[i];
          const originalRow = i + 1;

          if (row.length < 2) continue;

          const name = row[0]?.trim();
          const amountStr = row[1]?.trim();
          const upperCaseName = name?.toUpperCase();

          if (!name || upperCaseName === 'TOTAL (G)' || upperCaseName === 'TOTAL %') continue;

          const amountGrams = parseFloat(amountStr);
          if (isNaN(amountGrams) || amountGrams <= 0) continue;

          const lowerCaseName = name.toLowerCase();
          const matchedDbIngredient = allDbIngredients.find(
            (dbIng) =>
              dbIng.name.toLowerCase() === lowerCaseName ||
              dbIng.aliases?.some((alias) => alias.toLowerCase() === lowerCaseName)
          );

          if (matchedDbIngredient) {
            const alreadyInRecipe =
              recipeData.ingredients?.some((ing) => ing.ingredient._id === matchedDbIngredient._id) ||
              ingredientsToAdd.some((ing) => ing.ingredient._id === matchedDbIngredient._id);

            if (!alreadyInRecipe) {
              ingredientsToAdd.push({
                ingredient: { _id: matchedDbIngredient._id, name: matchedDbIngredient.name },
                amountGrams: amountGrams,
              });
            }
          } else {
            unmatched.push({ name, amountGrams, originalRow, reason: 'No trobat a la base de dades' });
          }
        }

        if (ingredientsToAdd.length > 0) {
          setRecipeData((prev) => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), ...ingredientsToAdd],
          }));
        }

        if (unmatched.length > 0) {
          setUnmatchedIngredients(unmatched);
          setResolvingIngredientIndex(0);
          setIsResolveModalOpen(true);
        } else {
          setSelectedCsvFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }

        setIsParsingCsv(false);
      },
      error: (parseError) => {
        console.error('CSV Parse error:', parseError);
        alert(`Error en processar el CSV: ${parseError.message}`);
        setIsParsingCsv(false);
      },
    });
  };

  const handleResolveSuccess = (resolvedIngredient: Ingredient, originalCsvAmount: number) => {
    const newRecipeIngredient: RecipeIngredient = {
      ingredient: { _id: resolvedIngredient._id, name: resolvedIngredient.name },
      amountGrams: originalCsvAmount,
    };
    setRecipeData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newRecipeIngredient],
    }));
    handleGoToNextUnmatched();
  };

  const handleGoToNextUnmatched = () => {
    setUnmatchedIngredients((prev) => {
      const remaining = prev.filter((_, index) => index !== resolvingIngredientIndex);
      if (remaining.length > 0) {
        setResolvingIngredientIndex(0);
      } else {
        setIsResolveModalOpen(false);
        setResolvingIngredientIndex(null);
        setSelectedCsvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      return remaining;
    });
  };

  const handleSkipUnmatched = () => {
    const nextIndex = (resolvingIngredientIndex ?? -1) + 1;
    if (nextIndex < unmatchedIngredients.length) {
      setResolvingIngredientIndex(nextIndex);
    } else {
      setIsResolveModalOpen(false);
      setResolvingIngredientIndex(null);
    }
  };

  const handleCloseResolveModal = () => {
    setIsResolveModalOpen(false);
    setResolvingIngredientIndex(null);
  };

  const handleSaveSuccess = (savedRecipe: RecipeDetails) => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    if (isEditing) {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    }
    queryClient.invalidateQueries({ queryKey: ['recipeDependencies'] });
    queryClient.invalidateQueries({ queryKey: ['ingredientDependencies'] });
    queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    onClose();
    onOpenRecipeTab(savedRecipe._id, savedRecipe.name);
  };

  const handleSaveError = (err: unknown) => {
    console.error('Save failed:', err);
    alert(`Error en desar: ${err instanceof Error ? err.message : 'Error desconegut'}`);
  };

  const createRecipeMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: handleSaveSuccess,
    onError: handleSaveError,
  });

  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipeDto }) => updateRecipe(id, data),
    onSuccess: handleSaveSuccess,
    onError: handleSaveError,
  });

  const handleSave = () => {
    if (!recipeData.name.trim()) {
      alert('El nom de la recepta és obligatori.');
      return;
    }

    const totalIngredientWeight = recipeData.ingredients?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
    const totalLinkedRecipeWeight = recipeData.linkedRecipes?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
    const calculatedBaseYield = totalIngredientWeight + totalLinkedRecipeWeight;
    const finalBaseYield = calculatedBaseYield > 0 ? calculatedBaseYield : 0;

    const payload = {
      name: recipeData.name,
      type: recipeData.type,
      category: recipeData.type === 'ice cream recipe' ? recipeData.category : undefined,
      baseYieldGrams: finalBaseYield,
      steps: recipeData.steps || [],
      ingredients: recipeData.ingredients?.map((item) => ({
        ingredient: item.ingredient._id,
        amountGrams: item.amountGrams,
      })) || [],
      linkedRecipes: recipeData.linkedRecipes?.map((item) => ({
        recipe: item.recipe._id,
        amountGrams: item.amountGrams,
      })) || [],
    };

    if (isEditing) {
      updateRecipeMutation.mutate({ id: recipeId!, data: payload as UpdateRecipeDto });
    } else {
      createRecipeMutation.mutate(payload as CreateRecipeDto);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const isSaving = createRecipeMutation.isPending || updateRecipeMutation.isPending;
  const isLoading = isLoadingExisting || isSaving || isParsingCsv;

  const currentTotalYield = useMemo(() => {
    const ingredientYield = recipeData.ingredients?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
    const linkedRecipeYield = recipeData.linkedRecipes?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
    return ingredientYield + linkedRecipeYield;
  }, [recipeData.ingredients, recipeData.linkedRecipes]);

  if (isEditing && isLoadingExisting)
    return <EditorContainer><p style={{ textAlign: 'center', color: 'var(--text-color-light)', padding: 'var(--space-2xl)' }}>Carregant dades de la recepta...</p></EditorContainer>;
  if (isEditing && isError)
    return <EditorContainer><p style={{ textAlign: 'center', color: 'var(--danger-color)' }}>Error carregant: {error instanceof Error ? error.message : 'Error desconegut'}</p></EditorContainer>;

  return (
    <EditorContainer>
      <h2 style={{ textAlign: 'center' }}>
        {isEditing ? `Edita Recepta: ${existingRecipe?.name ?? '...'}` : 'Nova Recepta'}
      </h2>

      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <SectionHeading>Informació Bàsica</SectionHeading>
          <FormGroup>
            <FormLabel htmlFor="recipe-name">Nom</FormLabel>
            <FormInput
              type="text"
              id="recipe-name"
              name="name"
              value={recipeData.name || ''}
              onChange={handleInputChange}
              required
              aria-required="true"
              disabled={isLoading}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="recipe-type">Tipus</FormLabel>
            <FormSelect
              id="recipe-type"
              name="type"
              value={recipeData.type || 'ice cream recipe'}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <option value="ice cream recipe">Recepta de Gelat</option>
              <option value="not ice cream recipe">No és Recepta de Gelat</option>
            </FormSelect>
          </FormGroup>
          {recipeData.type === 'ice cream recipe' && (
            <FormGroup>
              <FormLabel htmlFor="recipe-category">Categoria</FormLabel>
              <FormSelect
                id="recipe-category"
                name="category"
                value={recipeData.category || 'ice cream'}
                onChange={handleInputChange}
                required
                aria-required="true"
                disabled={isLoading}
              >
                <option value="ice cream">Gelat</option>
                <option value="sorbet">Sorbet</option>
              </FormSelect>
            </FormGroup>
          )}
        </div>

        <div>
          <SectionHeading>Components</SectionHeading>
          <ComponentList>
            {(recipeData.ingredients?.length === 0 && recipeData.linkedRecipes?.length === 0) && (
              <EmptyState>Encara no hi ha components.</EmptyState>
            )}
            {recipeData.ingredients?.map((item) => (
              <ComponentListItem key={`ing-${item.ingredient._id}`}>
                <div>
                  <ComponentName>{item.ingredient.name}</ComponentName>
                  <ComponentAmount>({item.amountGrams}g - Ingredient)</ComponentAmount>
                </div>
                <TextButton
                  onClick={() => handleRemoveRecipeComponent(item.ingredient._id, 'ingredient')}
                  disabled={isLoading}
                  style={{ color: 'var(--danger-color)' }}
                >
                  Elimina
                </TextButton>
              </ComponentListItem>
            ))}
            {recipeData.linkedRecipes?.map((item) => (
              <ComponentListItem key={`rec-${item.recipe._id}`}>
                <div>
                  <ComponentName>{item.recipe.name}</ComponentName>
                  <ComponentAmount>({item.amountGrams}g - Recepta)</ComponentAmount>
                </div>
                <TextButton
                  onClick={() => handleRemoveRecipeComponent(item.recipe._id, 'recipe')}
                  disabled={isLoading}
                  style={{ color: 'var(--danger-color)' }}
                >
                  Elimina
                </TextButton>
              </ComponentListItem>
            ))}
          </ComponentList>

          <FormGroup>
            <FormLabel>Rendiment Base</FormLabel>
            <YieldDisplay>{currentTotalYield} g</YieldDisplay>
          </FormGroup>

          <AddComponentForm>
            <div style={{ width: '100%', marginBottom: 'var(--space-lg)' }}>
              <FormLabel style={{ marginBottom: 'var(--space-sm)' }}>Afegeix Ingredient a la Recepta</FormLabel>
              <SearchableSelector<SelectableItem>
                queryKeyBase={ingredientsForFormQueryKeyBase}
                queryFn={fetchIngredientsForForm}
                onAdd={handleAddIngredientFromSelector}
                placeholder="Cerca ingredient per afegir..."
                minSearchLength={minSearchLength}
                disabled={isLoading}
                showAddControls={true}
              />
            </div>
            <div style={{ width: '100%' }}>
              <FormLabel style={{ marginBottom: 'var(--space-sm)' }}>Afegeix Recepta Vinculada</FormLabel>
              <SearchableSelector<SelectableItem>
                queryKeyBase={componentQueryKeyBase}
                queryFn={fetchLinkedRecipeCandidates}
                onAdd={handleAddLinkedRecipe}
                placeholder="Cerca i afegeix receptes vinculades..."
                minSearchLength={minSearchLength}
                disabled={isLoading}
              />
            </div>
          </AddComponentForm>

          <FormGroup style={{ marginTop: 'var(--space-xl)', borderTop: 'var(--border-width) solid var(--border-color-light)', paddingTop: 'var(--space-xl)' }}>
            <FormLabel htmlFor="csv-file-input">Importa Ingredients des de CSV</FormLabel>
            <FileInputRow>
              <FormInput
                ref={fileInputRef}
                type="file"
                id="csv-file-input"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
                style={{ flexGrow: 1, maxWidth: '400px' }}
              />
              <SecondaryButton
                type="button"
                onClick={handleImportCsv}
                disabled={!selectedCsvFile || isLoading}
              >
                {isParsingCsv ? 'Processant...' : 'Importa Fitxer'}
              </SecondaryButton>
            </FileInputRow>
            {selectedCsvFile && <FileInfo>Seleccionat: {selectedCsvFile.name}</FileInfo>}
          </FormGroup>

          {unmatchedIngredients.length > 0 && !isResolveModalOpen && (
            <UnmatchedNotice>
              <UnmatchedTitle>Acció Requerida: {unmatchedIngredients.length} Ingredient{unmatchedIngredients.length > 1 ? 's' : ''} no trobat{unmatchedIngredients.length > 1 ? 's' : ''}</UnmatchedTitle>
              <UnmatchedText>Alguns ingredients del CSV no s'han pogut trobar automàticament a la base de dades.</UnmatchedText>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setResolvingIngredientIndex(0);
                  setIsResolveModalOpen(true);
                }}
                disabled={isLoading}
              >
                Resol No Trobats ({unmatchedIngredients.length})
              </SecondaryButton>
            </UnmatchedNotice>
          )}
        </div>

        <div>
          <SectionHeading>Passos</SectionHeading>
          <StepList>
            {(recipeData.steps?.length === 0) && (
              <StepListItem style={{ color: 'var(--text-color-light)', fontStyle: 'italic' }}>
                Encara no hi ha passos.
              </StepListItem>
            )}
            {recipeData.steps?.map((step, index) => (
              <StepListItem key={index}>
                <StepTextArea
                  id={`step-description-${index}`}
                  aria-label={`Descripció del pas ${index + 1}`}
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  rows={3}
                  disabled={isLoading}
                />
                <TextButton
                  onClick={() => handleRemoveStep(index)}
                  disabled={isLoading}
                  style={{ color: 'var(--danger-color)', flexShrink: 0 }}
                >
                  Elimina
                </TextButton>
              </StepListItem>
            ))}
          </StepList>
          <StepButtonContainer>
            <SecondaryButton type="button" onClick={handleAddStep} disabled={isLoading}>
              Afegeix Pas Nou
            </SecondaryButton>
            {recipeData.type === 'ice cream recipe' && (
              <>
                <SecondaryButton type="button" onClick={() => handleAppendDefaultSteps('ice cream')} disabled={isLoading}>
                  Afegeix Passos per Defecte de Gelat
                </SecondaryButton>
                <SecondaryButton type="button" onClick={() => handleAppendDefaultSteps('sorbet')} disabled={isLoading}>
                  Afegeix Passos per Defecte de Sorbet
                </SecondaryButton>
              </>
            )}
          </StepButtonContainer>
        </div>

        <ButtonContainer>
          <SecondaryButton type="button" onClick={handleCancel} disabled={isLoading}>
            Cancel·la
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Desant...' : isEditing ? 'Desa Canvis' : 'Crea Recepta'}
          </PrimaryButton>
        </ButtonContainer>
      </form>

      {isResolveModalOpen && resolvingIngredientIndex !== null && unmatchedIngredients[resolvingIngredientIndex] && (
        <ResolveUnmatchedIngredientModal
          isOpen={isResolveModalOpen}
          onClose={handleCloseResolveModal}
          unmatchedItem={unmatchedIngredients[resolvingIngredientIndex]}
          itemNumber={resolvingIngredientIndex + 1}
          totalItems={unmatchedIngredients.length}
          onResolveSuccess={handleResolveSuccess}
          onSkip={handleSkipUnmatched}
          existingIngredientsQueryKeyBase={ingredientsForFormQueryKeyBase}
          fetchExistingIngredientsFn={fetchIngredientsForForm}
        />
      )}
    </EditorContainer>
  );
};


