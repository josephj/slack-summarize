import {
  VStack,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Link,
  Box,
  InputGroup,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import useFormPersist from 'react-hook-form-persist';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiExternalLink, FiCheck, FiX } from 'react-icons/fi';
import {
  validateSlackToken,
  validateOpenAIToken,
} from './services/slackService';
import { useCallback, useEffect, useState } from 'react';

const settingsSchema = z.object({
  slackToken: z.string().min(1, 'Slack token is required'),
  openAiToken: z.string().min(1, 'OpenAI token is required'),
  language: z.enum(['en', 'zh-Hant']),
  temperature: z.number().min(0).max(2),
  prompt: z.string().optional(),
});

export type SettingsData = z.infer<typeof settingsSchema>;

type Props = {
  onSettingsChange: (settings: SettingsData) => void;
};

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

type TokenValidation = {
  slackToken: ValidationStatus;
  openAiToken: ValidationStatus;
};

const Sidebar = ({ onSettingsChange }: Props) => {
  const [validation, setValidation] = useState<TokenValidation>({
    slackToken: 'idle',
    openAiToken: 'idle',
  });

  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: 'en',
      temperature: 0.7,
      prompt: 'Please summarise this Slack thread conversation',
    },
  });

  // Persist form data to localStorage
  useFormPersist('slack-summariser-settings', {
    watch,
    setValue,
    storage: window.localStorage,
  });

  // Watch all fields and notify parent component of changes
  watch((data) => {
    if (data.slackToken && data.openAiToken) {
      onSettingsChange(data as SettingsData);
    }
  });

  const validateToken = useCallback(
    async (type: 'slackToken' | 'openAiToken', token: string) => {
      if (!token) {
        setValidation((prev) => ({ ...prev, [type]: 'idle' }));
        return;
      }

      setValidation((prev) => ({ ...prev, [type]: 'validating' }));

      const isValid = await (type === 'slackToken'
        ? validateSlackToken(token)
        : validateOpenAIToken(token));

      setValidation((prev) => ({
        ...prev,
        [type]: isValid ? 'valid' : 'invalid',
      }));
    },
    []
  );

  useEffect(() => {
    const slackToken = watch('slackToken');
    const openAiToken = watch('openAiToken');

    if (slackToken) validateToken('slackToken', slackToken);
    if (openAiToken) validateToken('openAiToken', openAiToken);
  }, [validateToken, watch]);

  const ValidationIcon = ({ status }: { status: ValidationStatus }) => {
    switch (status) {
      case 'validating':
        return <Spinner size="sm" />;
      case 'valid':
        return <FiCheck color="green" />;
      case 'invalid':
        return <FiX color="red" />;
      default:
        return null;
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="xl" fontWeight="bold" mb={2}>
        Settings
      </Text>

      <Controller
        name="slackToken"
        control={control}
        render={({ field }) => (
          <FormControl isInvalid={!!errors.slackToken}>
            <FormLabel>Slack Token</FormLabel>
            <InputGroup>
              <Input
                type="password"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  validateToken('slackToken', e.target.value);
                }}
              />
              <InputRightElement>
                <ValidationIcon status={validation.slackToken} />
              </InputRightElement>
            </InputGroup>
            <FormHelperText>
              <Link
                href="https://api.slack.com/apps"
                isExternal
                color="blue.500"
                textDecoration="underline"
              >
                Get your Slack token
                <Box as={FiExternalLink} display="inline-block" ml="2px" />
              </Link>
            </FormHelperText>
            <FormErrorMessage>{errors.slackToken?.message}</FormErrorMessage>
          </FormControl>
        )}
      />

      <Controller
        name="openAiToken"
        control={control}
        render={({ field }) => (
          <FormControl isInvalid={!!errors.openAiToken}>
            <FormLabel>OpenAI Token</FormLabel>
            <InputGroup>
              <Input
                type="password"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  validateToken('openAiToken', e.target.value);
                }}
              />
              <InputRightElement>
                <ValidationIcon status={validation.openAiToken} />
              </InputRightElement>
            </InputGroup>
            <FormHelperText>
              <Link
                href="https://platform.openai.com/api-keys"
                isExternal
                color="blue.500"
                textDecoration="underline"
              >
                Get your OpenAI API key
                <Box as={FiExternalLink} display="inline-block" ml="2px" />
              </Link>
            </FormHelperText>
            <FormErrorMessage>{errors.openAiToken?.message}</FormErrorMessage>
          </FormControl>
        )}
      />

      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <FormControl>
            <FormLabel>Language</FormLabel>
            <Select {...field}>
              <option value="en">English</option>
              <option value="zh-TW">繁體中文</option>
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="temperature"
        control={control}
        render={({ field: { ref, ...field } }) => (
          <FormControl>
            <FormLabel>Temperature</FormLabel>
            <NumberInput
              {...field}
              min={0}
              max={2}
              step={0.1}
              onChange={(val) => field.onChange(Number(val))}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        )}
      />

      <Controller
        name="prompt"
        control={control}
        render={({ field }) => (
          <FormControl>
            <FormLabel>Custom Prompt</FormLabel>
            <Textarea {...field} />
          </FormControl>
        )}
      />
    </VStack>
  );
};

export default Sidebar;
