import { useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  Textarea,
  Button,
  Text,
  List,
  ListItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchSlackThread, generateSummary } from './services/slackService';
import Sidebar, { SettingsData } from './Sidebar';

type SlackMessage = {
  user: string;
  text: string;
  timestamp: string;
};

const formSchema = z.object({
  threadUrl: z.string().url('Please enter a valid Slack thread URL'),
  followUpQuestion: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const App = () => {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFormSubmit = async (data: FormData) => {
    if (!settings) return;

    setIsLoading(true);
    try {
      const fetchedMessages = await fetchSlackThread(
        data.threadUrl,
        settings.slackToken
      );
      const messages = fetchedMessages.map((msg) => ({
        user: msg.user,
        text: msg.text,
        timestamp: msg.ts,
      }));
      setMessages(messages);

      const generatedSummary = await generateSummary(
        fetchedMessages,
        settings.openAiToken,
        settings.prompt || '',
        settings.language,
        settings.temperature
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
                isDisabled={!settings}
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
        <Sidebar onSettingsChange={setSettings} />
      </GridItem>
    </Grid>
  );
};

export default App;
