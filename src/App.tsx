import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  Select,
  Textarea,
  Button,
  Text,
  List,
  ListItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormHelperText,
  Link,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import useFormPersist from 'react-hook-form-persist';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchSlackThread, generateSummary } from './services/slackService';
import { FiExternalLink } from 'react-icons/fi';

type SlackMessage = {
  user: string;
  text: string;
  timestamp: string;
};

const formSchema = z.object({
  slackToken: z.string().min(1, 'Slack token is required'),
  openAiToken: z.string().min(1, 'OpenAI token is required'),
  threadUrl: z.string().url('Please enter a valid Slack thread URL'),
  language: z.enum(['en', 'zh-Hant']),
  temperature: z.number().min(0).max(2),
  prompt: z.string().optional(),
  followUpQuestion: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const App = () => {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'en',
      temperature: 0.7,
      prompt: 'Please summarise this Slack thread conversation',
    },
  });

  // Persist form data to localStorage
  useFormPersist('slack-summariser-form', {
    watch,
    setValue,
    storage: window.localStorage, // default window.sessionStorage
    exclude: ['threadUrl', 'followUpQuestion'], // Don't persist these fields
  });

  const handleFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const fetchedMessages = await fetchSlackThread(
        data.threadUrl,
        data.slackToken
      );
      const messages = fetchedMessages.map((msg) => ({
        user: msg.user,
        text: msg.text,
        timestamp: msg.ts,
      }));
      setMessages(messages);

      const generatedSummary = await generateSummary(
        fetchedMessages,
        data.openAiToken,
        data.prompt || '',
        data.language,
        data.temperature
      );
      setSummary(generatedSummary);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid templateColumns="1fr 300px" h="100vh" gap={6} p={6}>
      {/* Main Content */}
      <GridItem>
        <VStack h="full" spacing={6} align="stretch">
          <FormControl isInvalid={!!errors.threadUrl}>
            <Box display="flex" gap={4}>
              <Controller
                name="threadUrl"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    flex="1"
                    placeholder="Enter Slack Thread URL"
                  />
                )}
              />
              <Button
                colorScheme="blue"
                onClick={handleSubmit(handleFormSubmit)}
                isLoading={isLoading}
                flexShrink={0}
              >
                Generate Summary
              </Button>
            </Box>
            <FormErrorMessage>{errors.threadUrl?.message}</FormErrorMessage>
          </FormControl>

          <Box flex="1" overflowY="auto">
            {summary && (
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  Summary
                </Text>
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text>{summary}</Text>
                </Box>
              </Box>
            )}

            {messages.length > 0 && (
              <Box mt={6}>
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  Conversation
                </Text>
                <List spacing={3}>
                  {messages.map((message, index) => (
                    <ListItem key={index} p={3} bg="gray.50" borderRadius="md">
                      <Text fontWeight="bold">{message.user}</Text>
                      <Text>{message.text}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(message.timestamp).toLocaleString()}
                      </Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          <Controller
            name="followUpQuestion"
            control={control}
            render={({ field }) => (
              <FormControl>
                <FormLabel>Ask for More Details</FormLabel>
                <Textarea
                  {...field}
                  placeholder="Ask a follow-up question about the summary..."
                />
              </FormControl>
            )}
          />
        </VStack>
      </GridItem>

      {/* Settings Sidebar */}
      <GridItem bg="gray.50" p={6} borderRadius="md">
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
                <Input type="password" {...field} />
                <FormHelperText>
                  Get your Slack token from{' '}
                  <Link
                    href="https://api.slack.com/apps"
                    isExternal
                    color="blue.500"
                    textDecoration="underline"
                  >
                    Slack API Apps
                    <Box as={FiExternalLink} display="inline-block" ml="2px" />
                  </Link>
                </FormHelperText>
                <FormErrorMessage>
                  {errors.slackToken?.message}
                </FormErrorMessage>
              </FormControl>
            )}
          />

          <Controller
            name="openAiToken"
            control={control}
            render={({ field }) => (
              <FormControl isInvalid={!!errors.openAiToken}>
                <FormLabel>OpenAI Token</FormLabel>
                <Input type="password" {...field} />
                <FormHelperText>
                  Get your OpenAI API key from{' '}
                  <Link
                    href="https://platform.openai.com/api-keys"
                    isExternal
                    color="blue.500"
                    textDecoration="underline"
                  >
                    OpenAI Dashboard
                    <Box as={FiExternalLink} display="inline-block" ml="2px" />
                  </Link>
                </FormHelperText>
                <FormErrorMessage>
                  {errors.openAiToken?.message}
                </FormErrorMessage>
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
                  <option value="zh-Hant">Traditional Chinese</option>
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
      </GridItem>
    </Grid>
  );
};

export default App;
